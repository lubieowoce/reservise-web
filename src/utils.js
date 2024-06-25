export const is_nonempty = (x) => !is_empty(x);

export const is_empty = (x) => {
  if (typeof x !== "object" || x === null) {
    return !x;
  }
  if (Symbol.iterator in x) {
    return is_empty_iterable(x);
  }
  return is_empty_object(x);
};

export const is_empty_object = (x) => {
  for (let prop in x) {
    if (Object.prototype.hasOwnProperty.call(x, prop)) {
      return false;
    }
  }
  return true;
};

export const is_empty_iterable = (xs) => {
  for (let x in xs) {
    return false;
  }
  return true;
};

export const $ajax_promise = (...args) => Promise.resolve($.ajax(...args));

export const is_instance_of = (x, proto) =>
  Object.prototype.isPrototypeOf.call(proto, x);

export const group_by = (xs, f) => {
  let g = {};
  for (let x of xs) {
    let fx = f(x);
    if (!(fx in g)) {
      g[fx] = [];
    }
    g[fx].push(x);
  }
  return g;
};
