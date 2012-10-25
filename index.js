/**
 * createError(name, message) -> Error
 * - name (String): Name of the error, such as 'ArgumentError'.
 * - message (String): Error message.
 *
 * Creates a named error for better error handling.
**/
function createError(name, message) {
  var error = new Error(message);
  error.name = name;
  return error;
}

/**
 * new RestStorage(data)
 * - constructor (Tubbs): The Tubbs model type to persist.
 * - config (Object): Configuration options.
 *
 * TODO: rename this module BrowserRest.
 * TODO: create server-side variant.
 * TODO: OR, use node's Request module and its browserland variant.
**/
function RestStorage(constructor, config) {
  this.Model = constructor;
  this.config = config;
  this.ready = false;

  // Hash of Type'd models.
  this.data = {};
}

/**
 * request(options, callback) -> undefined
 * - options (Object): Optional configuration options.
 * - callback (Function): Callback function when request is complete.
 *
 * Makes a request for JSON from a server. If data is provided, it will be
 * stringified as JSON before sending.
**/
function request(options, callback) {

  if (Object.prototype.toString.call(options) !== '[object Object]') {
    throw createError('ArgumentError', '"options" argument must be an Object.');
  }

  if (Object.prototype.toString.call(callback) !== '[object Function]') {
    throw createError('ArgumentError', '"callback" argument must be a Function.');
  }

  var config = this.config;
  var xhr = new XMLHttpRequest();

  var url = options.url || config.url;
  if (Object.prototype.toString.call(url) == '[object Function]') {
    url = url();
  }
  var method = options.method || 'GET';

  if (method.match(/^PUT|DELETE|PATCH$/)) {
    if (options.id) {
      url += '/' + options.id;
    } else {
      callback(createError("ArgumentError", method + ' requests require the `id` option.'));
      return;
    }
  }

  // TODO: may need to override HTTP method. Browser support metrics needed.
  xhr.open(method, url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;

    // TODO: handle user-defined timeout.
    var data;
    var error;
    try {
      data = JSON.parse(xhr.responseText)
    } catch (e) {}

    var status = xhr.status;
    if (status < 200 || status > 399) {
      var name = 'HttpError';
      var msg = (xhr.status + ' ' + xhr.statusText).trim();

      if (status === 0) {
        name = 'ConnectionError', msg = 'Could not connect: ' + msg;
      } else if (status >= 500) name = 'ServerError';
      error = createError(name, msg);
    }

    if (!error && xhr.getResponseHeader('Content-Type').indexOf('/json') == -1) {
      error = createError('HttpResponseError', 'Response is not JSON.');
    }

    callback(error, data);
  }.bind(this);

  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Accept', 'application/json');

  var hasBody = !!method.match(/^PUT|PATCH|POST$/) && options.data;
  if (hasBody) {
    // Only specific HTTP methods can haev data. Otherwise the server
    // could choke on the invalid requuest.
    // TODO: Should an error be thrown if the user tries to send data
    // via an incorrect HTTP method?
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf8');
  }

  if (config.headers) for (var name in config.headers) {
    // Configuration-specific headers.
    xhr.setRequestHeader(name, config.headers[name]);
  }

  if (options.headers) for (var name in options.headers) {
    // Request-specific headers.
    xhr.setRequestHeader(name, options.headers[name]);
  }

  xhr.send(hasBody ? JSON.stringify(options.data) : null);
}

Object.defineProperties(RestStorage.prototype, {
  /**
   * RestStorage#fetch(options, callback)
   * - callback (Function): Callback function can receive an error.
   *
   * Fetches all data from the endpoint and sets the internal collection to the result.
  **/
  fetch: {
    value: function(options, callback) {
      if (!options && !callback) {
        options = {};
        callback = function() {};

      } else if (options && Object.prototype.toString.call(options) == '[object Function]') {
        callback = options;
        options = {};
      }

      options = options || {};
      callback = callback || function() {};

      var Model = this.Model;
      var t = this;

      request.call(
        this,
        {
          method: options.method || 'GET',
          data: options.data,
          headers: options.headers,
          url: options.url
        },
        function(e, data) {
          if (e) {
            callback(e);
            return;
          }

          this.data = {};
          if (Array.isArray(data)) {
            var primaryKey = this.Model.primaryKey;
            data.forEach(function(item) {
              this.data[item[primaryKey]] = new Model(item);
            }.bind(this));

          } else {
            Object.keys(data).forEach(function(key) {
              t.data[key] = new Model(data[key]);
            });
          }

          this.ready = true;
          callback();
        }.bind(this)
      );
    },
    configurable: true
  },

  /**
   * RestStorage#all(callback(e, result))
   *
   * Provides an Array of all records in the dataset.
  **/
  all: {
    value: function(callback) {
      var result = [];

      Object.keys(this.data).forEach(function(id) {
        var doc = this.data[id];
        result.push(doc);
      }.bind(this));

      callback(null, result);
    },
    enumerable: true
  },

  /**
   * RestStorage#find(id, callback(e, result))
   * - id (?): The record ID in the database
   *
   * Finds a single record in the database.
  **/
  find: {
    value: function(id, callback) {
      if (id in this.data) {
        var doc = this.data[id];
        callback(null, doc);
        return;
      }
      callback(new Error("Document not found."), null);
    },
    enumerable: true
  },

  /**
   * RestStorage#where(args, filter, callback(e, result))
   * - args (Object): An object hash of named arguments which becomes the 2nd arg passed to `filter`.
   * - filter (Function): A function executed against each document which returns
   * `true` if the document should be included in the result.
   *
   * Provides an Array of all records which pass the `filter`.
  **/
  where: {
    value: function(args, filter, callback) {
      // TODO: decompose and recompose filter so that it is executed outside of
      // TODO: its originating closure. This is needed so that the RestStore
      // TODO: API operates the same as other server-based map/reduce API's.
      var result = [];
      Object.keys(this.data).forEach(function(id) {
        var doc = this.data[id];
        if (filter(doc, args)) {
          result.push(doc);
        }
      }.bind(this));
      callback(null, result);
    },
    enumerable: true
  },

  /**
   * RestStorage#save(record, callback(e, result))
   * - record (Object): An object (or JSON serializable object) to be saved to the database.
   *
   * Saves the provides object to the database.
  **/
  save: {
    value: function(record, callback) {
      if (!record) {
        return callback(createError('ArgumentError', 'Cannot save null model.'));
      }

      var Model = this.Model;
      var primaryKey = Model.primaryKey;

      if (record instanceof this.Model === false) {
        record = new this.Model(record);
      }

      // Could be create or update...
      var isNew = record.isNew;

      // Store ID from before save. If record is new, this will change.
      var id = record.id;

      request.call(
        this, {
          method: isNew ? 'POST' : 'PUT',
          id: isNew ? undefined : id,
          data: record
        },
        function(e, result) {
          if (!e) {
            if (!result || primaryKey in result === false) {
              e = createError('HttpResponseError', 'Response is missing a primaryKey and cannot be used.');
            } else {
              Object.keys(result).forEach(function(field) {
                // TODO: Should we do some sort of batched change set? Should it be silent?
                record[field] = result[field];
              });
              if (isNew) this.data[record.id] = record;
            }
          }
          callback(e, record);
        }.bind(this)
      );

    },
    enumerable: true
  }

});


/**
 * RestStorage#delete(record, callback(e, result))
 * - record (Object): An object (or JSON serializable object) to be deleted from the database.
 *
 * Deletes the provides object from the database.
**/
RestStorage.prototype.delete = function(record, callback) {
  var Model = this.Model;
  var primaryKey = Model.primaryKey;

  var id;

  if (!Object.prototype.toString.call(record).match(/\[object (String|Number)\]/)) {
    // If a model instance was provided, pull the id from the instance:
    id = record.id;
  } else id = record;

  // Delete local data for model:
  if (id in this.data) delete this.data[id];

  // Delete server data for model:
  request.call(
    this,
    { method: 'DELETE', id: id },
    function(e, result) { callback(e, null); }
  );
};

module.exports = RestStorage;
