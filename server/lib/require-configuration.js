/* @flow */
import { Request, Response, Next } from "express";
/**
 * This Middleware makes sure that we have the ship configured to make
 * 3rd API calls
 * @param  {Object}   req
 * @param  {Object}   res
 * @param  {Function} next
 */
export default function requireConfiguration(req: Request, res: Response, next: Next) {
  if (!req.hull.shipApp || !req.hull.shipApp.syncAgent || !req.hull.shipApp.syncAgent.isConfigured()) {
    req.hull.client.logger.info("ship is not configured");
    return res.status(403).send("Ship is not configured");
  }
  return next();
}