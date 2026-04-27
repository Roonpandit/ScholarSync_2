import { namespace } from './cls-namespace.js';

const setScholarSyncLog = (log) => {
  if (namespace && namespace.active) {
    namespace.set('scholarSyncLog', log);
  }
};

const getScholarSyncLog = () => (namespace && namespace.active ? namespace.get('scholarSyncLog') : {});

const appendToScholarSyncLog = (key, value) => {
  const log = getScholarSyncLog();
  log[key] = value;
  setScholarSyncLog(log);
};

const setRequestData = (req) => {
  if (namespace && namespace.active) {
    const requestData = {
      method: req.method,
      url: req.originalUrl || req.url,
      body: req.body || {},
      params: req.params || {},
      query: req.query || {},
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        authorization: req.headers['authorization'] ? 'Bearer ***' : undefined,
        'x-scholarsync-request-id': req.headers['x-scholarsync-request-id'],
        'x-scholarsync-group-id': req.headers['x-scholarsync-group-id'],
      },
    };
    namespace.set('requestData', requestData);
  }
};

const getRequestData = () => (namespace && namespace.active ? namespace.get('requestData') : {});

export { setScholarSyncLog, getScholarSyncLog, appendToScholarSyncLog, setRequestData, getRequestData };
