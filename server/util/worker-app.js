import Supply from "supply";
import Promise from "bluebird";
import _ from "lodash";

export default class WorkerApp {
  constructor({ queueAdapter, instrumentationAgent }) {
    this.queueAdapter = queueAdapter;
    this.handlers = {};
    this.instrumentationAgent = instrumentationAgent;
    this.supply = new Supply();
  }

  use(middleware) {
    if (middleware.length === 3) {
      this.supply.use(middleware);
    } else {
      middleware(this);
    }

    return this;
  }

  attach(jobName, worker) {
    this.handlers[jobName] = worker;
    return this;
  }

  process() {
    // FIXME: move queue name to dependencies
    this.queueAdapter.process("queueApp", (job) => {
      return this.dispatch(job);
    });

    return this;
  }

  dispatch(job) {
    const jobName = job.data.name;
    const req = job.data.context;
    const jobData = job.data.payload;
    console.log("dispatch", jobName, job.id);
    req.payload = jobData || {};
    const res = {};

    if (!this.handlers[jobName]) {
      const err = new Error(`No such job registered ${jobName}`);
      console.error(err.message)
      return Promise.reject(err);
    }
    return Promise.fromCallback((callback) => {
      this.instrumentationAgent.startTransaction(jobName, () => {
        this.runMiddleware(req, res)
          .then(() => {
            this.instrumentationAgent.metricInc("job.start", 1, req.hull.ship);
            return this.handlers[jobName].call(job, req, res);
          })
          .then((jobRes) => {
            callback(null, jobRes);
          }, (err) => {
            this.instrumentationAgent.metricInc("job.error", 1, req.hull.ship);
            this.instrumentationAgent.catchError(err, {
              job_id: job.id
            }, {
              job_name: job.data.name,
              organization: _.get(job.data.context, "query.organization"),
              ship: _.get(job.data.context, "query.ship")
            });
            callback(err);
          })
          .finally(() => {
            this.instrumentationAgent.endTransaction();
          });
      });
    });
  }

  runMiddleware(req, res) {
    return Promise.fromCallback((callback) => {
      this.supply
        .each(req, res, callback);
    });
  }
}
