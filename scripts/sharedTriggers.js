window.ScrollTriggers = {
  triggers: [],
  addTrigger(trigger) {
    this.triggers.push(trigger);
  },
  getTriggers() {
    return this.triggers;
  },
};
