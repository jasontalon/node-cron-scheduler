require("dotenv").config();

import fastify from "fastify";
import Scheduler, { Worker, Task } from "./scheduler";
import GraphQl from "./graphql";

const server = fastify({ logger: false }),
  {
    PORT = 8080,
    GQL_URL = "",
    GQL_HEADER = ""
  }: EnvironmentVariables = process.env,
  graphql = new GraphQl(GQL_URL, GQL_HEADER);

let scheduler: Scheduler = new Scheduler();

server.post("/add", async (request, reply) => {
  const task: Task = request.body as Task;
  const {
    id,
    task: {
      cron,
      name,
      handler: {
        code = "",
        http: {
          body: httpBody = "",
          headers: httpHeaders = "",
          method: httpMethod = "",
          url: httpUrl = ""
        } = {}
      }
    }
  } = scheduler.add(task);

  await graphql.save({
    id,
    cron,
    name,
    code,
    httpBody,
    httpHeaders,
    httpMethod,
    httpUrl
  });
  reply.status(200);
  return id;
});

server.get("/", async () => {
  return scheduler.workers.map(worker => ({
    id: worker.id,
    status: worker.status,
    task: worker.task
  }));
});

server.get("/status", async (request, response) => {
  return scheduler.workers;
});

server.post("/stop/:id", async (request, response) => {
  const worker: Worker | undefined = scheduler.workers.find(
    p => p.id == request.params.id
  );

  if (!worker) {
    response.status(404).send();
  } else {
    worker.cronJob!.stop();
    response.status(200).send();
  }
});

server.listen(PORT as number, async () => {
  console.log(`listents to port ${PORT}`);
});

interface EnvironmentVariables {
  PORT?: number;
  GQL_URL?: string;
  GQL_HEADER?: string;
}
