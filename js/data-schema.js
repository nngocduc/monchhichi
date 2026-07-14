(function(root){
  'use strict';

  const SCHEMA_VERSION = 1;
  const MAX_SERIALIZED_BYTES = 500000;
  const MAX_ITEMS = 100;
  const itemSchemas = {
    timeline: { date:[30,true], emoji:[16,true], title:[120,true], text:[2000,true] },
    album: { emoji:[16,true], caption:[120,true], story:[2000,true], date:[30,true], img:[2000,false,'url'] },
    collection: { doll:[16,true], name:[120,true], meta:[120,true], story:[2000,true] },
    letters: { seal:[16,true], when:[160,true], note:[160,true], title:[160,true], body:[10000,true] },
    playlist: { emoji:[16,true], song:[160,true], artist:[160,true], note:[500,true], url:[2000,true,'url'] }
  };

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value){
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function isHttpUrl(value){
    if(value === '') return true;
    try{
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    }catch(error){
      return false;
    }
  }

  function isAnniversary(value){
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if(!match) return false;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;
  }

  function readString(value, maxLength, path, errors, options){
    options = options || {};
    if(typeof value !== 'string'){
      errors.push(path + ' must be a string');
      return '';
    }
    if(options.required && value.length === 0) errors.push(path + ' is required');
    if(value.length > maxLength) errors.push(path + ' exceeds ' + maxLength + ' characters');
    if(options.url && !isHttpUrl(value)) errors.push(path + ' must be an HTTP(S) URL or empty');
    return value;
  }

  function validateItem(section, input, index, errors){
    const path = section + '[' + index + ']';
    if(!isPlainObject(input)){
      errors.push(path + ' must be an object');
      return null;
    }
    const schema = itemSchemas[section];
    const allowedKeys = Object.keys(schema);
    const unknownKeys = Object.keys(input).filter(key => !allowedKeys.includes(key));
    if(unknownKeys.length) errors.push(path + ' has unsupported fields: ' + unknownKeys.join(', '));
    const output = {};
    for(const entry of Object.entries(schema)){
      const key = entry[0];
      const definition = entry[1];
      const maxLength = definition[0];
      const required = definition[1];
      const format = definition[2];
      if(!(key in input)){
        if(required) errors.push(path + '.' + key + ' is required');
        continue;
      }
      output[key] = readString(input[key], maxLength, path + '.' + key, errors, {
        required:required,
        url:format === 'url'
      });
    }
    return output;
  }

  function validate(data){
    const errors = [];
    if(!isPlainObject(data)) return {ok:false, data:null, errors:['data must be an object']};
    const allowedRootKeys = ['anniversary','signature','timeline','album','collection','letters','playlist','secret'];
    const unknownRootKeys = Object.keys(data).filter(key => !allowedRootKeys.includes(key));
    if(unknownRootKeys.length) errors.push('data has unsupported fields: ' + unknownRootKeys.join(', '));
    const output = {
      anniversary:readString(data.anniversary, 10, 'anniversary', errors, {required:true}),
      signature:readString(data.signature, 200, 'signature', errors, {required:true})
    };
    if(typeof data.anniversary === 'string' && !isAnniversary(data.anniversary)){
      errors.push('anniversary must be a real date in dd/mm/yyyy format');
    }
    for(const section of Object.keys(itemSchemas)){
      const list = data[section];
      if(!Array.isArray(list)){
        errors.push(section + ' must be an array');
        output[section] = [];
        continue;
      }
      if(list.length > MAX_ITEMS) errors.push(section + ' exceeds ' + MAX_ITEMS + ' items');
      output[section] = list.slice(0, MAX_ITEMS)
        .map((item, index) => validateItem(section, item, index, errors))
        .filter(Boolean);
    }
    const secret = data.secret;
    if(!isPlainObject(secret)){
      errors.push('secret must be an object');
      output.secret = {success:'', fail:[], monchhichi5:'', typeLove:''};
    }else{
      const secretKeys = ['success','fail','monchhichi5','typeLove'];
      const unknownSecretKeys = Object.keys(secret).filter(key => !secretKeys.includes(key));
      if(unknownSecretKeys.length) errors.push('secret has unsupported fields: ' + unknownSecretKeys.join(', '));
      const failures = Array.isArray(secret.fail) ? secret.fail : [];
      if(!Array.isArray(secret.fail)) errors.push('secret.fail must be an array');
      if(failures.length < 1 || failures.length > 10) errors.push('secret.fail must contain 1 to 10 messages');
      output.secret = {
        success:readString(secret.success, 2000, 'secret.success', errors, {required:true}),
        fail:failures.slice(0, 10).map((message, index) =>
          readString(message, 500, 'secret.fail[' + index + ']', errors, {required:true})),
        monchhichi5:readString(secret.monchhichi5, 2000, 'secret.monchhichi5', errors, {required:true}),
        typeLove:readString(secret.typeLove, 2000, 'secret.typeLove', errors, {required:true})
      };
    }
    const serialized = JSON.stringify({schemaVersion:SCHEMA_VERSION, data:output});
    if(new TextEncoder().encode(serialized).length > MAX_SERIALIZED_BYTES){
      errors.push('serialized data exceeds ' + MAX_SERIALIZED_BYTES + ' bytes');
    }
    return {ok:errors.length === 0, data:errors.length ? null : output, errors:errors};
  }

  function serialize(data){
    const result = validate(data);
    if(!result.ok) throw new Error('Invalid room data: ' + result.errors.join('; '));
    return JSON.stringify({schemaVersion:SCHEMA_VERSION, data:result.data});
  }

  function parse(value){
    let parsed = value;
    try{
      if(typeof value === 'string') parsed = JSON.parse(value);
    }catch(error){
      return {ok:false, data:null, errors:['stored data is not valid JSON'], legacy:false};
    }
    const isEnvelope = isPlainObject(parsed) && 'schemaVersion' in parsed;
    if(isEnvelope){
      if(parsed.schemaVersion !== SCHEMA_VERSION){
        return {ok:false, data:null, errors:['unsupported schema version: ' + parsed.schemaVersion], legacy:false};
      }
      return Object.assign({}, validate(parsed.data), {legacy:false});
    }
    return Object.assign({}, validate(parsed), {legacy:true});
  }

  root.dataSchema = Object.freeze({
    version:SCHEMA_VERSION,
    maxSerializedBytes:MAX_SERIALIZED_BYTES,
    validate:validate,
    serialize:serialize,
    parse:parse,
    clone:clone
  });
})(typeof window !== 'undefined' ? window : globalThis);
