import { Strategy as IntercomStrategy } from "passport-intercom";
import moment from "moment";

// import AppMiddleware from "../lib/middleware/app";

export default function OAuthRouter(deps) {

  const {
    Hull,
    shipConfig,
    queueAdapter,
    shipCache,
    instrumentationAgent
  } = deps;

  const {
    hostSecret,
    clientID,
    clientSecret,
  } = shipConfig;


  const { OAuthHandler } = Hull;

  return OAuthHandler({
    hostSecret,
    shipCache,
    name: "Intercom",
    Strategy: IntercomStrategy,
    options: {
      clientID,
      clientSecret
    },
    isSetup(req, { hull, ship }) {
      if (req.query.reset) return Promise.reject();
      const { access_token, api_key, app_id } = ship.private_settings || {};

      if (access_token || (api_key && app_id)) {
        // TODO: we have notices problems with syncing hull segments property
        // after a Hubspot resync, there may be a problem with notification
        // subscription. Following two lines fixes that problem.
        // AppMiddleware({ queueAdapter, shipCache, instrumentationAgent })(req, {}, () => {});
        // req.shipApp.hubspotAgent.syncContactProperties()
        //   .catch((err) => hull.logger.error("Error in creating segments property", err));

        return hull.get(ship.id).then(s => {
          return { settings: s.private_settings };
        });
      }
      return Promise.reject();
    },
    onLogin: (req, { hull, ship }) => {
      return Promise.resolve();
    },
    onAuthorize: (req, { hull, ship }) => {
      const { refreshToken, accessToken, expiresIn } = (req.account || {});
      const newShip = {
        private_settings: {
          ...ship.private_settings,
          access_token: accessToken,
          token_fetched_at: moment().utc().format("x"),
        }
      };
      return hull.put(ship.id, newShip)
        .then(() => {
          return shipCache.del(ship.id);
        });
    },
    views: {
      login: "login.html",
      home: "home.html",
      failure: "failure.html",
      success: "success.html"
    },
  });
}
