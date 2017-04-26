import { Router } from "express";
import cors from "cors";
import { notifHandler, batchHandler } from "hull/lib/utils";

import AppMiddleware from "../lib/app-middleware";
import requireConfiguration from "../util/middleware/require-configuration";

export default function AppRouter(deps) {
  const router = new Router();
  const { jobs } = deps;
  const { Actions, NotifHandlers } = deps.controllers;

  // FIXME: since we have two routers on the same mountpoint: "/"
  // all middleware applied here also is applied to the static router,
  // which is a bad things, that's why we add the middleware on per route basis
  // router.use(deps.hullMiddleware);
  // router.use(AppMiddleware(deps));

  const middlewareSet = [requireConfiguration];

  router.use(AppMiddleware());
  router.use("/batch", ...middlewareSet, Actions.handleBatchAction, batchHandler(jobs.handleBatch, {}));

  router.use("/notify", notifHandler({
    userHandlerOptions: {
      groupTraits: false
    },
    handlers: {
      "segment:update": NotifHandlers.segmentUpdateHandler,
      "segment:delete": NotifHandlers.segmentDeleteHandler,
      "user:update": NotifHandlers.userUpdateHandler,
      "ship:update": NotifHandlers.shipUpdateHandler
    }
  }));

  router.post("/fetch-all", ...middlewareSet, Actions.fetchAll);
  // FIXME: 404 for that endpoint?
  router.post("/intercom", ...middlewareSet, Actions.webhook);

  router.post("/sync", ...middlewareSet, Actions.sync);

  router.get("/schema/user_fields", cors(), ...middlewareSet, Actions.fields);

  return router;
}
