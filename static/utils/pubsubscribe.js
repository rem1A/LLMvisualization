let channels = new Map();

function subscribe(channel, listener) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(listener);
}

function unsubscribe(topic, listener) {
  let channel = channels.get(topic);
  if (channel) {
    channel.delete(listener);
    if (channel.size === 0) channels.delete(topic);
  }
}

function publish(msg, ...data) {
  _publish(false, msg, data);
}

function publishSync(msg, ...data) {
  _publish(true, msg, data);
}

function _publish(sync, msg, data) {
  let list = subscribers(msg);
  if (list.length === 0) return;
  let send = envelop(list, msg, data);

  if (sync) send();
  else setTimeout(send, 0);
}

function subscribers(msg) {
  let topic = String(msg), list = [], idx;
  while (true) {
    if (channels.has(topic)) list.push(topic);
    idx = topic.lastIndexOf('.');
    if (idx === -1) break;
    topic = topic.substring(0, idx);
  }
  return list;
}

function envelop(subscribers, msg, data) {
  return () => {
    subscribers.forEach(topic => broadcast(topic, msg, data));
  };
}

function broadcast(topic, msg, data) {
  let channel = channels.get(topic) || new Set();
  for (let listener of channel) {
    listener(topic, ...data);
  }
}

// ✅ 这里是关键：定义 pubsub 对象并导出
export const pubsub = {
  subscribe,
  unsubscribe,
  publish,
  publishSync
};