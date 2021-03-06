import _ from "lodash";
import uri from "urijs";
import Promise from "bluebird";

export default class WebhookAgent {

  constructor(intercomAgent, hullAgent, ship, hostname) {
    this.ship = ship;
    this.hullAgent = hullAgent;
    this.hullClient = hullAgent.hullClient;
    this.intercomClient = intercomAgent.intercomClient;
    this.hostname = hostname;

    this.webhookId = _.get(this.ship, "private_settings.webhook_id");

    this.topics = [
      "user.created", "user.deleted",
      "user.tag.created", "user.tag.deleted", "user.unsubscribed",
      "conversation.user.created", "conversation.user.replied",
      "conversation.admin.replied", "conversation.admin.single.created",
      "conversation.admin.assigned", "conversation.admin.opened",
      "conversation.admin.closed", "user.email.updated"
    ];
  }

  /**
   * @return Promise
   */
  ensureWebhook() {
    if (this.webhookId) {
      return this.intercomClient.get(`/subscriptions/${this.webhookId}`)
        .then(({ body }) => {
          const missingTopics = _.difference(this.topics, body.topics);
          if (_.isEmpty(missingTopics)) {
            return Promise.resolve(this.webhookId);
          }
          return this.createWebhook(this.webhookId);
        }, (error) => {
          if (error.response.statusCode === 404) {
            return this.createWebhook();
          }
          return Promise.reject(error);
        });
    }
    return this.createWebhook();
  }

  /**
   * Creates or updates webhook
   * @type {String} webhookId optional id of existing webhook
   */
  createWebhook(webhookId = "") {
    const url = this.getWebhookUrl();

    return this.intercomClient.post(`/subscriptions/${webhookId}`)
      .send({
        service_type: "web",
        topics: this.topics,
        url
      })
      .catch(err => {
        const fErr = this.intercomClient.handleError(err);
        // handle errors which may happen here
        return Promise.reject(fErr);
      })
      .then(res => {
        this.webhookId = res.body.id;
        return this.hullAgent.updateShipSettings({
          webhook_id: this.webhookId
        }).then(() => {
          return this.webhookId;
        });
      });
  }

  getWebhookUrl() {
    const { organization, id, secret } = this.hullClient.configuration();
    const search = {
      organization,
      secret,
      ship: id
    };
    return uri(`https://${this.hostname}/intercom`).search(search).toString();
  }
}
