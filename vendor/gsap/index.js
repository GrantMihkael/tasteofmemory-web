const noopTween = { kill() {} }

export const gsap = {
  registerPlugin() {},
  utils: { toArray: (items) => Array.from(items || []) },
  from() { return noopTween },
  to() { return noopTween },
}
