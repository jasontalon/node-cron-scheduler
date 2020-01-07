import { CronJob } from "cron";
import { EventEmitter } from "events";
import Axios from "axios";

const nanoid = require("nanoid");

export default class Scheduler {
  workers: Worker[];
  eventEmitter: EventEmitter;

  constructor() {
    this.workers = [];
    this.eventEmitter = new EventEmitter();

    this.eventEmitter.on("started", workerId => {
      this.updateStatus(workerId, "BUSY");
    });
    this.eventEmitter.on("finished", workerId => {
      this.updateStatus(workerId, "IDLE");
    });
    this.eventEmitter.on("error", args => {
      console.log(args.error);
      this.updateStatus(args.id, "ERROR");
    });
  }

  add(task: Task): Worker { 
    let worker: Worker = {
      task,
      id: nanoid(4)
    };

    worker.cronJob = this.initCronJob(worker);

    this.workers.push(worker);

    worker.cronJob.start();

    return worker;
  }

  set(worker: Worker): Scheduler {
    worker.cronJob = this.initCronJob(worker);
    worker.cronJob.start();

    this.workers.push(worker);
    return this;
  }

  initCronJob(worker: Worker): CronJob {
    return new CronJob(worker.task.cron, async () => {
      const {
        id,
        task: {
          handler: {
            code = null,
            http: { body = {}, headers = "", method = null, url = null } = {}
          } = {}
        } = {}
      } = worker;
      this.eventEmitter.emit("started", id);
      try {
        if (code) {
          await eval(`
            const axios = require('axios');
            (async () => {
              ${code}
            })();`);
        } else if (url && method) {
          const { data } = await (Axios as any)[method](url, body, {
            headers: headers ? JSON.parse(headers) : {}
          });
          console.log(data);
        }
      } catch (error) {
        this.eventEmitter.emit("error", { id, error });
      } finally {
        this.eventEmitter.emit("finished", id);
      }
    });
  }

  private updateStatus(workerId: string, status: Status) {
    const worker: Worker | undefined = this.workers.find(p => p.id == workerId);
    console.log({ id: worker?.id, status });
    worker!.status = status;
  }
}

export interface Worker {
  id: string;
  task: Task;
  cronJob?: CronJob;
  status?: Status;
}

export type Status = "STOPPED" | "IDLE" | "BUSY" | "ERROR";

export interface Task {
  cron: string;
  name: string;
  handler: {
    code: string;
    http: Http;
  };
}

export interface Http {
  method?: "get" | "post";
  url?: string;
  body?: string;
  headers?: string;
}
