export const patchStyle = (el, prev, next) => {
  const style = el.style;
  if (!next) {
    el.removeAttribute("style");
  } else {
    for (const key in next) {
      style[key] = next[key];
    }
    if (prev) {
      for (const key in prev) {
        if (!next[key]) style[key] = "";
      }
    }
  }
};
