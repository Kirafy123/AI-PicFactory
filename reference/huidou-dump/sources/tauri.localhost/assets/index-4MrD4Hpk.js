import { s as Le, a as De } from "./index-CMG-ejQn.js";
const Oe = {
    type: "3rdParty",
    init(r) {
      (Le(r.options.react), De(r));
    },
  },
  f = (r) => typeof r == "string",
  G = () => {
    let r, e;
    const t = new Promise((n, i) => {
      ((r = n), (e = i));
    });
    return ((t.resolve = r), (t.reject = e), t);
  },
  se = (r) => (r == null ? "" : "" + r),
  Re = (r, e, t) => {
    r.forEach((n) => {
      e[n] && (t[n] = e[n]);
    });
  },
  Ae = /###/g,
  re = (r) => (r && r.indexOf("###") > -1 ? r.replace(Ae, ".") : r),
  oe = (r) => !r || f(r),
  H = (r, e, t) => {
    const n = f(e) ? e.split(".") : e;
    let i = 0;
    for (; i < n.length - 1; ) {
      if (oe(r)) return {};
      const s = re(n[i]);
      (!r[s] && t && (r[s] = new t()),
        Object.prototype.hasOwnProperty.call(r, s) ? (r = r[s]) : (r = {}),
        ++i);
    }
    return oe(r) ? {} : { obj: r, k: re(n[i]) };
  },
  ae = (r, e, t) => {
    const { obj: n, k: i } = H(r, e, Object);
    if (n !== void 0 || e.length === 1) {
      n[i] = t;
      return;
    }
    let s = e[e.length - 1],
      o = e.slice(0, e.length - 1),
      a = H(r, o, Object);
    for (; a.obj === void 0 && o.length; )
      ((s = `${o[o.length - 1]}.${s}`),
        (o = o.slice(0, o.length - 1)),
        (a = H(r, o, Object)),
        a != null &&
          a.obj &&
          typeof a.obj[`${a.k}.${s}`] < "u" &&
          (a.obj = void 0));
    a.obj[`${a.k}.${s}`] = t;
  },
  Te = (r, e, t, n) => {
    const { obj: i, k: s } = H(r, e, Object);
    ((i[s] = i[s] || []), i[s].push(t));
  },
  J = (r, e) => {
    const { obj: t, k: n } = H(r, e);
    if (t && Object.prototype.hasOwnProperty.call(t, n)) return t[n];
  },
  Ie = (r, e, t) => {
    const n = J(r, t);
    return n !== void 0 ? n : J(e, t);
  },
  we = (r, e, t) => {
    for (const n in e)
      n !== "__proto__" &&
        n !== "constructor" &&
        (n in r
          ? f(r[n]) ||
            r[n] instanceof String ||
            f(e[n]) ||
            e[n] instanceof String
            ? t && (r[n] = e[n])
            : we(r[n], e[n], t)
          : (r[n] = e[n]));
    return r;
  },
  $ = (r) => r.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var Ne = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "/": "&#x2F;",
};
const $e = (r) => (f(r) ? r.replace(/[&<>"'\/]/g, (e) => Ne[e]) : r);
class Ee {
  constructor(e) {
    ((this.capacity = e),
      (this.regExpMap = new Map()),
      (this.regExpQueue = []));
  }
  getRegExp(e) {
    const t = this.regExpMap.get(e);
    if (t !== void 0) return t;
    const n = new RegExp(e);
    return (
      this.regExpQueue.length === this.capacity &&
        this.regExpMap.delete(this.regExpQueue.shift()),
      this.regExpMap.set(e, n),
      this.regExpQueue.push(e),
      n
    );
  }
}
const Fe = [" ", ",", "?", "!", ";"],
  Ue = new Ee(20),
  je = (r, e, t) => {
    ((e = e || ""), (t = t || ""));
    const n = Fe.filter((o) => e.indexOf(o) < 0 && t.indexOf(o) < 0);
    if (n.length === 0) return !0;
    const i = Ue.getRegExp(
      `(${n.map((o) => (o === "?" ? "\\?" : o)).join("|")})`,
    );
    let s = !i.test(r);
    if (!s) {
      const o = r.indexOf(t);
      o > 0 && !i.test(r.substring(0, o)) && (s = !0);
    }
    return s;
  },
  _ = function (r, e) {
    let t =
      arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : ".";
    if (!r) return;
    if (r[e]) return Object.prototype.hasOwnProperty.call(r, e) ? r[e] : void 0;
    const n = e.split(t);
    let i = r;
    for (let s = 0; s < n.length; ) {
      if (!i || typeof i != "object") return;
      let o,
        a = "";
      for (let l = s; l < n.length; ++l)
        if ((l !== s && (a += t), (a += n[l]), (o = i[a]), o !== void 0)) {
          if (
            ["string", "number", "boolean"].indexOf(typeof o) > -1 &&
            l < n.length - 1
          )
            continue;
          s += l - s + 1;
          break;
        }
      i = o;
    }
    return i;
  },
  q = (r) => (r == null ? void 0 : r.replace("_", "-")),
  Ke = {
    type: "logger",
    log(r) {
      this.output("log", r);
    },
    warn(r) {
      this.output("warn", r);
    },
    error(r) {
      this.output("error", r);
    },
    output(r, e) {
      var t, n;
      (n =
        (t = console == null ? void 0 : console[r]) == null
          ? void 0
          : t.apply) == null || n.call(t, console, e);
    },
  };
class Y {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    this.init(e, t);
  }
  init(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    ((this.prefix = t.prefix || "i18next:"),
      (this.logger = e || Ke),
      (this.options = t),
      (this.debug = t.debug));
  }
  log() {
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
      t[n] = arguments[n];
    return this.forward(t, "log", "", !0);
  }
  warn() {
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
      t[n] = arguments[n];
    return this.forward(t, "warn", "", !0);
  }
  error() {
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
      t[n] = arguments[n];
    return this.forward(t, "error", "");
  }
  deprecate() {
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
      t[n] = arguments[n];
    return this.forward(t, "warn", "WARNING DEPRECATED: ", !0);
  }
  forward(e, t, n, i) {
    return i && !this.debug
      ? null
      : (f(e[0]) && (e[0] = `${n}${this.prefix} ${e[0]}`), this.logger[t](e));
  }
  create(e) {
    return new Y(this.logger, {
      prefix: `${this.prefix}:${e}:`,
      ...this.options,
    });
  }
  clone(e) {
    return (
      (e = e || this.options),
      (e.prefix = e.prefix || this.prefix),
      new Y(this.logger, e)
    );
  }
}
var R = new Y();
class Z {
  constructor() {
    this.observers = {};
  }
  on(e, t) {
    return (
      e.split(" ").forEach((n) => {
        this.observers[n] || (this.observers[n] = new Map());
        const i = this.observers[n].get(t) || 0;
        this.observers[n].set(t, i + 1);
      }),
      this
    );
  }
  off(e, t) {
    if (this.observers[e]) {
      if (!t) {
        delete this.observers[e];
        return;
      }
      this.observers[e].delete(t);
    }
  }
  emit(e) {
    for (
      var t = arguments.length, n = new Array(t > 1 ? t - 1 : 0), i = 1;
      i < t;
      i++
    )
      n[i - 1] = arguments[i];
    (this.observers[e] &&
      Array.from(this.observers[e].entries()).forEach((o) => {
        let [a, l] = o;
        for (let u = 0; u < l; u++) a(...n);
      }),
      this.observers["*"] &&
        Array.from(this.observers["*"].entries()).forEach((o) => {
          let [a, l] = o;
          for (let u = 0; u < l; u++) a.apply(a, [e, ...n]);
        }));
  }
}
class le extends Z {
  constructor(e) {
    let t =
      arguments.length > 1 && arguments[1] !== void 0
        ? arguments[1]
        : { ns: ["translation"], defaultNS: "translation" };
    (super(),
      (this.data = e || {}),
      (this.options = t),
      this.options.keySeparator === void 0 && (this.options.keySeparator = "."),
      this.options.ignoreJSONStructure === void 0 &&
        (this.options.ignoreJSONStructure = !0));
  }
  addNamespaces(e) {
    this.options.ns.indexOf(e) < 0 && this.options.ns.push(e);
  }
  removeNamespaces(e) {
    const t = this.options.ns.indexOf(e);
    t > -1 && this.options.ns.splice(t, 1);
  }
  getResource(e, t, n) {
    var u, c;
    let i = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    const s =
        i.keySeparator !== void 0 ? i.keySeparator : this.options.keySeparator,
      o =
        i.ignoreJSONStructure !== void 0
          ? i.ignoreJSONStructure
          : this.options.ignoreJSONStructure;
    let a;
    e.indexOf(".") > -1
      ? (a = e.split("."))
      : ((a = [e, t]),
        n &&
          (Array.isArray(n)
            ? a.push(...n)
            : f(n) && s
              ? a.push(...n.split(s))
              : a.push(n)));
    const l = J(this.data, a);
    return (
      !l &&
        !t &&
        !n &&
        e.indexOf(".") > -1 &&
        ((e = a[0]), (t = a[1]), (n = a.slice(2).join("."))),
      l || !o || !f(n)
        ? l
        : _(
            (c = (u = this.data) == null ? void 0 : u[e]) == null
              ? void 0
              : c[t],
            n,
            s,
          )
    );
  }
  addResource(e, t, n, i) {
    let s =
      arguments.length > 4 && arguments[4] !== void 0
        ? arguments[4]
        : { silent: !1 };
    const o =
      s.keySeparator !== void 0 ? s.keySeparator : this.options.keySeparator;
    let a = [e, t];
    (n && (a = a.concat(o ? n.split(o) : n)),
      e.indexOf(".") > -1 && ((a = e.split(".")), (i = t), (t = a[1])),
      this.addNamespaces(t),
      ae(this.data, a, i),
      s.silent || this.emit("added", e, t, n, i));
  }
  addResources(e, t, n) {
    let i =
      arguments.length > 3 && arguments[3] !== void 0
        ? arguments[3]
        : { silent: !1 };
    for (const s in n)
      (f(n[s]) || Array.isArray(n[s])) &&
        this.addResource(e, t, s, n[s], { silent: !0 });
    i.silent || this.emit("added", e, t, n);
  }
  addResourceBundle(e, t, n, i, s) {
    let o =
        arguments.length > 5 && arguments[5] !== void 0
          ? arguments[5]
          : { silent: !1, skipCopy: !1 },
      a = [e, t];
    (e.indexOf(".") > -1 && ((a = e.split(".")), (i = n), (n = t), (t = a[1])),
      this.addNamespaces(t));
    let l = J(this.data, a) || {};
    (o.skipCopy || (n = JSON.parse(JSON.stringify(n))),
      i ? we(l, n, s) : (l = { ...l, ...n }),
      ae(this.data, a, l),
      o.silent || this.emit("added", e, t, n));
  }
  removeResourceBundle(e, t) {
    (this.hasResourceBundle(e, t) && delete this.data[e][t],
      this.removeNamespaces(t),
      this.emit("removed", e, t));
  }
  hasResourceBundle(e, t) {
    return this.getResource(e, t) !== void 0;
  }
  getResourceBundle(e, t) {
    return (t || (t = this.options.defaultNS), this.getResource(e, t));
  }
  getDataByLanguage(e) {
    return this.data[e];
  }
  hasLanguageSomeTranslations(e) {
    const t = this.getDataByLanguage(e);
    return !!((t && Object.keys(t)) || []).find(
      (i) => t[i] && Object.keys(t[i]).length > 0,
    );
  }
  toJSON() {
    return this.data;
  }
}
var ve = {
  processors: {},
  addPostProcessor(r) {
    this.processors[r.name] = r;
  },
  handle(r, e, t, n, i) {
    return (
      r.forEach((s) => {
        var o;
        e =
          ((o = this.processors[s]) == null ? void 0 : o.process(e, t, n, i)) ??
          e;
      }),
      e
    );
  },
};
const ue = {},
  de = (r) => !f(r) && typeof r != "boolean" && typeof r != "number";
class Q extends Z {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    (super(),
      Re(
        [
          "resourceStore",
          "languageUtils",
          "pluralResolver",
          "interpolator",
          "backendConnector",
          "i18nFormat",
          "utils",
        ],
        e,
        this,
      ),
      (this.options = t),
      this.options.keySeparator === void 0 && (this.options.keySeparator = "."),
      (this.logger = R.create("translator")));
  }
  changeLanguage(e) {
    e && (this.language = e);
  }
  exists(e) {
    let t =
      arguments.length > 1 && arguments[1] !== void 0
        ? arguments[1]
        : { interpolation: {} };
    if (e == null) return !1;
    const n = this.resolve(e, t);
    return (n == null ? void 0 : n.res) !== void 0;
  }
  extractFromKey(e, t) {
    let n = t.nsSeparator !== void 0 ? t.nsSeparator : this.options.nsSeparator;
    n === void 0 && (n = ":");
    const i =
      t.keySeparator !== void 0 ? t.keySeparator : this.options.keySeparator;
    let s = t.ns || this.options.defaultNS || [];
    const o = n && e.indexOf(n) > -1,
      a =
        !this.options.userDefinedKeySeparator &&
        !t.keySeparator &&
        !this.options.userDefinedNsSeparator &&
        !t.nsSeparator &&
        !je(e, n, i);
    if (o && !a) {
      const l = e.match(this.interpolator.nestingRegexp);
      if (l && l.length > 0) return { key: e, namespaces: f(s) ? [s] : s };
      const u = e.split(n);
      ((n !== i || (n === i && this.options.ns.indexOf(u[0]) > -1)) &&
        (s = u.shift()),
        (e = u.join(i)));
    }
    return { key: e, namespaces: f(s) ? [s] : s };
  }
  translate(e, t, n) {
    if (
      (typeof t != "object" &&
        this.options.overloadTranslationOptionHandler &&
        (t = this.options.overloadTranslationOptionHandler(arguments)),
      typeof t == "object" && (t = { ...t }),
      t || (t = {}),
      e == null)
    )
      return "";
    Array.isArray(e) || (e = [String(e)]);
    const i =
        t.returnDetails !== void 0
          ? t.returnDetails
          : this.options.returnDetails,
      s =
        t.keySeparator !== void 0 ? t.keySeparator : this.options.keySeparator,
      { key: o, namespaces: a } = this.extractFromKey(e[e.length - 1], t),
      l = a[a.length - 1],
      u = t.lng || this.language,
      c = t.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
    if ((u == null ? void 0 : u.toLowerCase()) === "cimode") {
      if (c) {
        const C = t.nsSeparator || this.options.nsSeparator;
        return i
          ? {
              res: `${l}${C}${o}`,
              usedKey: o,
              exactUsedKey: o,
              usedLng: u,
              usedNS: l,
              usedParams: this.getUsedParamsDetails(t),
            }
          : `${l}${C}${o}`;
      }
      return i
        ? {
            res: o,
            usedKey: o,
            exactUsedKey: o,
            usedLng: u,
            usedNS: l,
            usedParams: this.getUsedParamsDetails(t),
          }
        : o;
    }
    const g = this.resolve(e, t);
    let d = g == null ? void 0 : g.res;
    const m = (g == null ? void 0 : g.usedKey) || o,
      h = (g == null ? void 0 : g.exactUsedKey) || o,
      p = ["[object Number]", "[object Function]", "[object RegExp]"],
      y = t.joinArrays !== void 0 ? t.joinArrays : this.options.joinArrays,
      S = !this.i18nFormat || this.i18nFormat.handleAsObject,
      w = t.count !== void 0 && !f(t.count),
      D = Q.hasDefaultValue(t),
      k = w ? this.pluralResolver.getSuffix(u, t.count, t) : "",
      j =
        t.ordinal && w
          ? this.pluralResolver.getSuffix(u, t.count, { ordinal: !1 })
          : "",
      K = w && !t.ordinal && t.count === 0,
      b =
        (K && t[`defaultValue${this.options.pluralSeparator}zero`]) ||
        t[`defaultValue${k}`] ||
        t[`defaultValue${j}`] ||
        t.defaultValue;
    let v = d;
    S && !d && D && (v = b);
    const I = de(v),
      N = Object.prototype.toString.apply(v);
    if (S && v && I && p.indexOf(N) < 0 && !(f(y) && Array.isArray(v))) {
      if (!t.returnObjects && !this.options.returnObjects) {
        this.options.returnedObjectHandler ||
          this.logger.warn(
            "accessing an object - but returnObjects options is not enabled!",
          );
        const C = this.options.returnedObjectHandler
          ? this.options.returnedObjectHandler(m, v, { ...t, ns: a })
          : `key '${o} (${this.language})' returned an object instead of string.`;
        return i
          ? ((g.res = C), (g.usedParams = this.getUsedParamsDetails(t)), g)
          : C;
      }
      if (s) {
        const C = Array.isArray(v),
          L = C ? [] : {},
          ee = C ? h : m;
        for (const O in v)
          if (Object.prototype.hasOwnProperty.call(v, O)) {
            const A = `${ee}${s}${O}`;
            (D && !d
              ? (L[O] = this.translate(A, {
                  ...t,
                  defaultValue: de(b) ? b[O] : void 0,
                  joinArrays: !1,
                  ns: a,
                }))
              : (L[O] = this.translate(A, { ...t, joinArrays: !1, ns: a })),
              L[O] === A && (L[O] = v[O]));
          }
        d = L;
      }
    } else if (S && f(y) && Array.isArray(d))
      ((d = d.join(y)), d && (d = this.extendTranslation(d, e, t, n)));
    else {
      let C = !1,
        L = !1;
      (!this.isValidLookup(d) && D && ((C = !0), (d = b)),
        this.isValidLookup(d) || ((L = !0), (d = o)));
      const O =
          (t.missingKeyNoValueFallbackToKey ||
            this.options.missingKeyNoValueFallbackToKey) &&
          L
            ? void 0
            : d,
        A = D && b !== d && this.options.updateMissing;
      if (L || C || A) {
        if (
          (this.logger.log(A ? "updateKey" : "missingKey", u, l, o, A ? b : d),
          s)
        ) {
          const P = this.resolve(o, { ...t, keySeparator: !1 });
          P &&
            P.res &&
            this.logger.warn(
              "Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.",
            );
        }
        let V = [];
        const z = this.languageUtils.getFallbackCodes(
          this.options.fallbackLng,
          t.lng || this.language,
        );
        if (this.options.saveMissingTo === "fallback" && z && z[0])
          for (let P = 0; P < z.length; P++) V.push(z[P]);
        else
          this.options.saveMissingTo === "all"
            ? (V = this.languageUtils.toResolveHierarchy(
                t.lng || this.language,
              ))
            : V.push(t.lng || this.language);
        const te = (P, T, M) => {
          var ie;
          const ne = D && M !== d ? M : O;
          (this.options.missingKeyHandler
            ? this.options.missingKeyHandler(P, l, T, ne, A, t)
            : (ie = this.backendConnector) != null &&
              ie.saveMissing &&
              this.backendConnector.saveMissing(P, l, T, ne, A, t),
            this.emit("missingKey", P, l, T, d));
        };
        this.options.saveMissing &&
          (this.options.saveMissingPlurals && w
            ? V.forEach((P) => {
                const T = this.pluralResolver.getSuffixes(P, t);
                (K &&
                  t[`defaultValue${this.options.pluralSeparator}zero`] &&
                  T.indexOf(`${this.options.pluralSeparator}zero`) < 0 &&
                  T.push(`${this.options.pluralSeparator}zero`),
                  T.forEach((M) => {
                    te([P], o + M, t[`defaultValue${M}`] || b);
                  }));
              })
            : te(V, o, b));
      }
      ((d = this.extendTranslation(d, e, t, g, n)),
        L &&
          d === o &&
          this.options.appendNamespaceToMissingKey &&
          (d = `${l}:${o}`),
        (L || C) &&
          this.options.parseMissingKeyHandler &&
          (d = this.options.parseMissingKeyHandler(
            this.options.appendNamespaceToMissingKey ? `${l}:${o}` : o,
            C ? d : void 0,
          )));
    }
    return i
      ? ((g.res = d), (g.usedParams = this.getUsedParamsDetails(t)), g)
      : d;
  }
  extendTranslation(e, t, n, i, s) {
    var u, c;
    var o = this;
    if ((u = this.i18nFormat) != null && u.parse)
      e = this.i18nFormat.parse(
        e,
        { ...this.options.interpolation.defaultVariables, ...n },
        n.lng || this.language || i.usedLng,
        i.usedNS,
        i.usedKey,
        { resolved: i },
      );
    else if (!n.skipInterpolation) {
      n.interpolation &&
        this.interpolator.init({
          ...n,
          interpolation: { ...this.options.interpolation, ...n.interpolation },
        });
      const g =
        f(e) &&
        (((c = n == null ? void 0 : n.interpolation) == null
          ? void 0
          : c.skipOnVariables) !== void 0
          ? n.interpolation.skipOnVariables
          : this.options.interpolation.skipOnVariables);
      let d;
      if (g) {
        const h = e.match(this.interpolator.nestingRegexp);
        d = h && h.length;
      }
      let m = n.replace && !f(n.replace) ? n.replace : n;
      if (
        (this.options.interpolation.defaultVariables &&
          (m = { ...this.options.interpolation.defaultVariables, ...m }),
        (e = this.interpolator.interpolate(
          e,
          m,
          n.lng || this.language || i.usedLng,
          n,
        )),
        g)
      ) {
        const h = e.match(this.interpolator.nestingRegexp),
          p = h && h.length;
        d < p && (n.nest = !1);
      }
      (!n.lng && i && i.res && (n.lng = this.language || i.usedLng),
        n.nest !== !1 &&
          (e = this.interpolator.nest(
            e,
            function () {
              for (
                var h = arguments.length, p = new Array(h), y = 0;
                y < h;
                y++
              )
                p[y] = arguments[y];
              return (s == null ? void 0 : s[0]) === p[0] && !n.context
                ? (o.logger.warn(
                    `It seems you are nesting recursively key: ${p[0]} in key: ${t[0]}`,
                  ),
                  null)
                : o.translate(...p, t);
            },
            n,
          )),
        n.interpolation && this.interpolator.reset());
    }
    const a = n.postProcess || this.options.postProcess,
      l = f(a) ? [a] : a;
    return (
      e != null &&
        l != null &&
        l.length &&
        n.applyPostProcessor !== !1 &&
        (e = ve.handle(
          l,
          e,
          t,
          this.options && this.options.postProcessPassResolved
            ? {
                i18nResolved: {
                  ...i,
                  usedParams: this.getUsedParamsDetails(n),
                },
                ...n,
              }
            : n,
          this,
        )),
      e
    );
  }
  resolve(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      n,
      i,
      s,
      o,
      a;
    return (
      f(e) && (e = [e]),
      e.forEach((l) => {
        if (this.isValidLookup(n)) return;
        const u = this.extractFromKey(l, t),
          c = u.key;
        i = c;
        let g = u.namespaces;
        this.options.fallbackNS && (g = g.concat(this.options.fallbackNS));
        const d = t.count !== void 0 && !f(t.count),
          m = d && !t.ordinal && t.count === 0,
          h =
            t.context !== void 0 &&
            (f(t.context) || typeof t.context == "number") &&
            t.context !== "",
          p = t.lngs
            ? t.lngs
            : this.languageUtils.toResolveHierarchy(
                t.lng || this.language,
                t.fallbackLng,
              );
        g.forEach((y) => {
          var S, w;
          this.isValidLookup(n) ||
            ((a = y),
            !ue[`${p[0]}-${y}`] &&
              (S = this.utils) != null &&
              S.hasLoadedNamespace &&
              !((w = this.utils) != null && w.hasLoadedNamespace(a)) &&
              ((ue[`${p[0]}-${y}`] = !0),
              this.logger.warn(
                `key "${i}" for languages "${p.join(", ")}" won't get resolved as namespace "${a}" was not yet loaded`,
                "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!",
              )),
            p.forEach((D) => {
              var K;
              if (this.isValidLookup(n)) return;
              o = D;
              const k = [c];
              if ((K = this.i18nFormat) != null && K.addLookupKeys)
                this.i18nFormat.addLookupKeys(k, c, D, y, t);
              else {
                let b;
                d && (b = this.pluralResolver.getSuffix(D, t.count, t));
                const v = `${this.options.pluralSeparator}zero`,
                  I = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                if (
                  (d &&
                    (k.push(c + b),
                    t.ordinal &&
                      b.indexOf(I) === 0 &&
                      k.push(c + b.replace(I, this.options.pluralSeparator)),
                    m && k.push(c + v)),
                  h)
                ) {
                  const N = `${c}${this.options.contextSeparator}${t.context}`;
                  (k.push(N),
                    d &&
                      (k.push(N + b),
                      t.ordinal &&
                        b.indexOf(I) === 0 &&
                        k.push(N + b.replace(I, this.options.pluralSeparator)),
                      m && k.push(N + v)));
                }
              }
              let j;
              for (; (j = k.pop()); )
                this.isValidLookup(n) ||
                  ((s = j), (n = this.getResource(D, y, j, t)));
            }));
        });
      }),
      { res: n, usedKey: i, exactUsedKey: s, usedLng: o, usedNS: a }
    );
  }
  isValidLookup(e) {
    return (
      e !== void 0 &&
      !(!this.options.returnNull && e === null) &&
      !(!this.options.returnEmptyString && e === "")
    );
  }
  getResource(e, t, n) {
    var s;
    let i = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    return (s = this.i18nFormat) != null && s.getResource
      ? this.i18nFormat.getResource(e, t, n, i)
      : this.resourceStore.getResource(e, t, n, i);
  }
  getUsedParamsDetails() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const t = [
        "defaultValue",
        "ordinal",
        "context",
        "replace",
        "lng",
        "lngs",
        "fallbackLng",
        "ns",
        "keySeparator",
        "nsSeparator",
        "returnObjects",
        "returnDetails",
        "joinArrays",
        "postProcess",
        "interpolation",
      ],
      n = e.replace && !f(e.replace);
    let i = n ? e.replace : e;
    if (
      (n && typeof e.count < "u" && (i.count = e.count),
      this.options.interpolation.defaultVariables &&
        (i = { ...this.options.interpolation.defaultVariables, ...i }),
      !n)
    ) {
      i = { ...i };
      for (const s of t) delete i[s];
    }
    return i;
  }
  static hasDefaultValue(e) {
    const t = "defaultValue";
    for (const n in e)
      if (
        Object.prototype.hasOwnProperty.call(e, n) &&
        t === n.substring(0, t.length) &&
        e[n] !== void 0
      )
        return !0;
    return !1;
  }
}
class ce {
  constructor(e) {
    ((this.options = e),
      (this.supportedLngs = this.options.supportedLngs || !1),
      (this.logger = R.create("languageUtils")));
  }
  getScriptPartFromCode(e) {
    if (((e = q(e)), !e || e.indexOf("-") < 0)) return null;
    const t = e.split("-");
    return t.length === 2 || (t.pop(), t[t.length - 1].toLowerCase() === "x")
      ? null
      : this.formatLanguageCode(t.join("-"));
  }
  getLanguagePartFromCode(e) {
    if (((e = q(e)), !e || e.indexOf("-") < 0)) return e;
    const t = e.split("-");
    return this.formatLanguageCode(t[0]);
  }
  formatLanguageCode(e) {
    if (f(e) && e.indexOf("-") > -1) {
      let t;
      try {
        t = Intl.getCanonicalLocales(e)[0];
      } catch {}
      return (
        t && this.options.lowerCaseLng && (t = t.toLowerCase()),
        t || (this.options.lowerCaseLng ? e.toLowerCase() : e)
      );
    }
    return this.options.cleanCode || this.options.lowerCaseLng
      ? e.toLowerCase()
      : e;
  }
  isSupportedCode(e) {
    return (
      (this.options.load === "languageOnly" ||
        this.options.nonExplicitSupportedLngs) &&
        (e = this.getLanguagePartFromCode(e)),
      !this.supportedLngs ||
        !this.supportedLngs.length ||
        this.supportedLngs.indexOf(e) > -1
    );
  }
  getBestMatchFromCodes(e) {
    if (!e) return null;
    let t;
    return (
      e.forEach((n) => {
        if (t) return;
        const i = this.formatLanguageCode(n);
        (!this.options.supportedLngs || this.isSupportedCode(i)) && (t = i);
      }),
      !t &&
        this.options.supportedLngs &&
        e.forEach((n) => {
          if (t) return;
          const i = this.getLanguagePartFromCode(n);
          if (this.isSupportedCode(i)) return (t = i);
          t = this.options.supportedLngs.find((s) => {
            if (s === i) return s;
            if (
              !(s.indexOf("-") < 0 && i.indexOf("-") < 0) &&
              ((s.indexOf("-") > 0 &&
                i.indexOf("-") < 0 &&
                s.substring(0, s.indexOf("-")) === i) ||
                (s.indexOf(i) === 0 && i.length > 1))
            )
              return s;
          });
        }),
      t || (t = this.getFallbackCodes(this.options.fallbackLng)[0]),
      t
    );
  }
  getFallbackCodes(e, t) {
    if (!e) return [];
    if (
      (typeof e == "function" && (e = e(t)),
      f(e) && (e = [e]),
      Array.isArray(e))
    )
      return e;
    if (!t) return e.default || [];
    let n = e[t];
    return (
      n || (n = e[this.getScriptPartFromCode(t)]),
      n || (n = e[this.formatLanguageCode(t)]),
      n || (n = e[this.getLanguagePartFromCode(t)]),
      n || (n = e.default),
      n || []
    );
  }
  toResolveHierarchy(e, t) {
    const n = this.getFallbackCodes(t || this.options.fallbackLng || [], e),
      i = [],
      s = (o) => {
        o &&
          (this.isSupportedCode(o)
            ? i.push(o)
            : this.logger.warn(
                `rejecting language code not found in supportedLngs: ${o}`,
              ));
      };
    return (
      f(e) && (e.indexOf("-") > -1 || e.indexOf("_") > -1)
        ? (this.options.load !== "languageOnly" &&
            s(this.formatLanguageCode(e)),
          this.options.load !== "languageOnly" &&
            this.options.load !== "currentOnly" &&
            s(this.getScriptPartFromCode(e)),
          this.options.load !== "currentOnly" &&
            s(this.getLanguagePartFromCode(e)))
        : f(e) && s(this.formatLanguageCode(e)),
      n.forEach((o) => {
        i.indexOf(o) < 0 && s(this.formatLanguageCode(o));
      }),
      i
    );
  }
}
const ge = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 },
  he = {
    select: (r) => (r === 1 ? "one" : "other"),
    resolvedOptions: () => ({ pluralCategories: ["one", "other"] }),
  };
class Ve {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    ((this.languageUtils = e),
      (this.options = t),
      (this.logger = R.create("pluralResolver")),
      (this.pluralRulesCache = {}));
  }
  addRule(e, t) {
    this.rules[e] = t;
  }
  clearCache() {
    this.pluralRulesCache = {};
  }
  getRule(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const n = q(e === "dev" ? "en" : e),
      i = t.ordinal ? "ordinal" : "cardinal",
      s = JSON.stringify({ cleanedCode: n, type: i });
    if (s in this.pluralRulesCache) return this.pluralRulesCache[s];
    let o;
    try {
      o = new Intl.PluralRules(n, { type: i });
    } catch {
      if (!Intl)
        return (
          this.logger.error("No Intl support, please use an Intl polyfill!"),
          he
        );
      if (!e.match(/-|_/)) return he;
      const l = this.languageUtils.getLanguagePartFromCode(e);
      o = this.getRule(l, t);
    }
    return ((this.pluralRulesCache[s] = o), o);
  }
  needsPlural(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      n = this.getRule(e, t);
    return (
      n || (n = this.getRule("dev", t)),
      (n == null ? void 0 : n.resolvedOptions().pluralCategories.length) > 1
    );
  }
  getPluralFormsOfKey(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    return this.getSuffixes(e, n).map((i) => `${t}${i}`);
  }
  getSuffixes(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      n = this.getRule(e, t);
    return (
      n || (n = this.getRule("dev", t)),
      n
        ? n
            .resolvedOptions()
            .pluralCategories.sort((i, s) => ge[i] - ge[s])
            .map(
              (i) =>
                `${this.options.prepend}${t.ordinal ? `ordinal${this.options.prepend}` : ""}${i}`,
            )
        : []
    );
  }
  getSuffix(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    const i = this.getRule(e, n);
    return i
      ? `${this.options.prepend}${n.ordinal ? `ordinal${this.options.prepend}` : ""}${i.select(t)}`
      : (this.logger.warn(`no plural rule found for: ${e}`),
        this.getSuffix("dev", t, n));
  }
}
const fe = function (r, e, t) {
    let n =
        arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : ".",
      i = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : !0,
      s = Ie(r, e, t);
    return (
      !s && i && f(t) && ((s = _(r, t, n)), s === void 0 && (s = _(e, t, n))),
      s
    );
  },
  X = (r) => r.replace(/\$/g, "$$$$");
class Me {
  constructor() {
    var t;
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    ((this.logger = R.create("interpolator")),
      (this.options = e),
      (this.format =
        ((t = e == null ? void 0 : e.interpolation) == null
          ? void 0
          : t.format) || ((n) => n)),
      this.init(e));
  }
  init() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    e.interpolation || (e.interpolation = { escapeValue: !0 });
    const {
      escape: t,
      escapeValue: n,
      useRawValueToEscape: i,
      prefix: s,
      prefixEscaped: o,
      suffix: a,
      suffixEscaped: l,
      formatSeparator: u,
      unescapeSuffix: c,
      unescapePrefix: g,
      nestingPrefix: d,
      nestingPrefixEscaped: m,
      nestingSuffix: h,
      nestingSuffixEscaped: p,
      nestingOptionsSeparator: y,
      maxReplaces: S,
      alwaysFormat: w,
    } = e.interpolation;
    ((this.escape = t !== void 0 ? t : $e),
      (this.escapeValue = n !== void 0 ? n : !0),
      (this.useRawValueToEscape = i !== void 0 ? i : !1),
      (this.prefix = s ? $(s) : o || "{{"),
      (this.suffix = a ? $(a) : l || "}}"),
      (this.formatSeparator = u || ","),
      (this.unescapePrefix = c ? "" : g || "-"),
      (this.unescapeSuffix = this.unescapePrefix ? "" : c || ""),
      (this.nestingPrefix = d ? $(d) : m || $("$t(")),
      (this.nestingSuffix = h ? $(h) : p || $(")")),
      (this.nestingOptionsSeparator = y || ","),
      (this.maxReplaces = S || 1e3),
      (this.alwaysFormat = w !== void 0 ? w : !1),
      this.resetRegExp());
  }
  reset() {
    this.options && this.init(this.options);
  }
  resetRegExp() {
    const e = (t, n) =>
      (t == null ? void 0 : t.source) === n
        ? ((t.lastIndex = 0), t)
        : new RegExp(n, "g");
    ((this.regexp = e(this.regexp, `${this.prefix}(.+?)${this.suffix}`)),
      (this.regexpUnescape = e(
        this.regexpUnescape,
        `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`,
      )),
      (this.nestingRegexp = e(
        this.nestingRegexp,
        `${this.nestingPrefix}(.+?)${this.nestingSuffix}`,
      )));
  }
  interpolate(e, t, n, i) {
    var m;
    let s, o, a;
    const l =
        (this.options &&
          this.options.interpolation &&
          this.options.interpolation.defaultVariables) ||
        {},
      u = (h) => {
        if (h.indexOf(this.formatSeparator) < 0) {
          const w = fe(
            t,
            l,
            h,
            this.options.keySeparator,
            this.options.ignoreJSONStructure,
          );
          return this.alwaysFormat
            ? this.format(w, void 0, n, { ...i, ...t, interpolationkey: h })
            : w;
        }
        const p = h.split(this.formatSeparator),
          y = p.shift().trim(),
          S = p.join(this.formatSeparator).trim();
        return this.format(
          fe(
            t,
            l,
            y,
            this.options.keySeparator,
            this.options.ignoreJSONStructure,
          ),
          S,
          n,
          { ...i, ...t, interpolationkey: y },
        );
      };
    this.resetRegExp();
    const c =
        (i == null ? void 0 : i.missingInterpolationHandler) ||
        this.options.missingInterpolationHandler,
      g =
        ((m = i == null ? void 0 : i.interpolation) == null
          ? void 0
          : m.skipOnVariables) !== void 0
          ? i.interpolation.skipOnVariables
          : this.options.interpolation.skipOnVariables;
    return (
      [
        { regex: this.regexpUnescape, safeValue: (h) => X(h) },
        {
          regex: this.regexp,
          safeValue: (h) => (this.escapeValue ? X(this.escape(h)) : X(h)),
        },
      ].forEach((h) => {
        for (a = 0; (s = h.regex.exec(e)); ) {
          const p = s[1].trim();
          if (((o = u(p)), o === void 0))
            if (typeof c == "function") {
              const S = c(e, s, i);
              o = f(S) ? S : "";
            } else if (i && Object.prototype.hasOwnProperty.call(i, p)) o = "";
            else if (g) {
              o = s[0];
              continue;
            } else
              (this.logger.warn(
                `missed to pass in variable ${p} for interpolating ${e}`,
              ),
                (o = ""));
          else !f(o) && !this.useRawValueToEscape && (o = se(o));
          const y = h.safeValue(o);
          if (
            ((e = e.replace(s[0], y)),
            g
              ? ((h.regex.lastIndex += o.length),
                (h.regex.lastIndex -= s[0].length))
              : (h.regex.lastIndex = 0),
            a++,
            a >= this.maxReplaces)
          )
            break;
        }
      }),
      e
    );
  }
  nest(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {},
      i,
      s,
      o;
    const a = (l, u) => {
      const c = this.nestingOptionsSeparator;
      if (l.indexOf(c) < 0) return l;
      const g = l.split(new RegExp(`${c}[ ]*{`));
      let d = `{${g[1]}`;
      ((l = g[0]), (d = this.interpolate(d, o)));
      const m = d.match(/'/g),
        h = d.match(/"/g);
      ((((m == null ? void 0 : m.length) ?? 0) % 2 === 0 && !h) ||
        h.length % 2 !== 0) &&
        (d = d.replace(/'/g, '"'));
      try {
        ((o = JSON.parse(d)), u && (o = { ...u, ...o }));
      } catch (p) {
        return (
          this.logger.warn(
            `failed parsing options string in nesting for key ${l}`,
            p,
          ),
          `${l}${c}${d}`
        );
      }
      return (
        o.defaultValue &&
          o.defaultValue.indexOf(this.prefix) > -1 &&
          delete o.defaultValue,
        l
      );
    };
    for (; (i = this.nestingRegexp.exec(e)); ) {
      let l = [];
      ((o = { ...n }),
        (o = o.replace && !f(o.replace) ? o.replace : o),
        (o.applyPostProcessor = !1),
        delete o.defaultValue);
      let u = !1;
      if (i[0].indexOf(this.formatSeparator) !== -1 && !/{.*}/.test(i[1])) {
        const c = i[1].split(this.formatSeparator).map((g) => g.trim());
        ((i[1] = c.shift()), (l = c), (u = !0));
      }
      if (((s = t(a.call(this, i[1].trim(), o), o)), s && i[0] === e && !f(s)))
        return s;
      (f(s) || (s = se(s)),
        s ||
          (this.logger.warn(`missed to resolve ${i[1]} for nesting ${e}`),
          (s = "")),
        u &&
          (s = l.reduce(
            (c, g) =>
              this.format(c, g, n.lng, { ...n, interpolationkey: i[1].trim() }),
            s.trim(),
          )),
        (e = e.replace(i[0], s)),
        (this.regexp.lastIndex = 0));
    }
    return e;
  }
}
const Ge = (r) => {
    let e = r.toLowerCase().trim();
    const t = {};
    if (r.indexOf("(") > -1) {
      const n = r.split("(");
      e = n[0].toLowerCase().trim();
      const i = n[1].substring(0, n[1].length - 1);
      e === "currency" && i.indexOf(":") < 0
        ? t.currency || (t.currency = i.trim())
        : e === "relativetime" && i.indexOf(":") < 0
          ? t.range || (t.range = i.trim())
          : i.split(";").forEach((o) => {
              if (o) {
                const [a, ...l] = o.split(":"),
                  u = l
                    .join(":")
                    .trim()
                    .replace(/^'+|'+$/g, ""),
                  c = a.trim();
                (t[c] || (t[c] = u),
                  u === "false" && (t[c] = !1),
                  u === "true" && (t[c] = !0),
                  isNaN(u) || (t[c] = parseInt(u, 10)));
              }
            });
    }
    return { formatName: e, formatOptions: t };
  },
  E = (r) => {
    const e = {};
    return (t, n, i) => {
      let s = i;
      i &&
        i.interpolationkey &&
        i.formatParams &&
        i.formatParams[i.interpolationkey] &&
        i[i.interpolationkey] &&
        (s = { ...s, [i.interpolationkey]: void 0 });
      const o = n + JSON.stringify(s);
      let a = e[o];
      return (a || ((a = r(q(n), i)), (e[o] = a)), a(t));
    };
  };
class He {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    ((this.logger = R.create("formatter")),
      (this.options = e),
      (this.formats = {
        number: E((t, n) => {
          const i = new Intl.NumberFormat(t, { ...n });
          return (s) => i.format(s);
        }),
        currency: E((t, n) => {
          const i = new Intl.NumberFormat(t, { ...n, style: "currency" });
          return (s) => i.format(s);
        }),
        datetime: E((t, n) => {
          const i = new Intl.DateTimeFormat(t, { ...n });
          return (s) => i.format(s);
        }),
        relativetime: E((t, n) => {
          const i = new Intl.RelativeTimeFormat(t, { ...n });
          return (s) => i.format(s, n.range || "day");
        }),
        list: E((t, n) => {
          const i = new Intl.ListFormat(t, { ...n });
          return (s) => i.format(s);
        }),
      }),
      this.init(e));
  }
  init(e) {
    let t =
      arguments.length > 1 && arguments[1] !== void 0
        ? arguments[1]
        : { interpolation: {} };
    this.formatSeparator = t.interpolation.formatSeparator || ",";
  }
  add(e, t) {
    this.formats[e.toLowerCase().trim()] = t;
  }
  addCached(e, t) {
    this.formats[e.toLowerCase().trim()] = E(t);
  }
  format(e, t, n) {
    let i = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    const s = t.split(this.formatSeparator);
    if (
      s.length > 1 &&
      s[0].indexOf("(") > 1 &&
      s[0].indexOf(")") < 0 &&
      s.find((a) => a.indexOf(")") > -1)
    ) {
      const a = s.findIndex((l) => l.indexOf(")") > -1);
      s[0] = [s[0], ...s.splice(1, a)].join(this.formatSeparator);
    }
    return s.reduce((a, l) => {
      var g;
      const { formatName: u, formatOptions: c } = Ge(l);
      if (this.formats[u]) {
        let d = a;
        try {
          const m =
              ((g = i == null ? void 0 : i.formatParams) == null
                ? void 0
                : g[i.interpolationkey]) || {},
            h = m.locale || m.lng || i.locale || i.lng || n;
          d = this.formats[u](a, h, { ...c, ...i, ...m });
        } catch (m) {
          this.logger.warn(m);
        }
        return d;
      } else this.logger.warn(`there was no format function for ${u}`);
      return a;
    }, e);
  }
}
const Be = (r, e) => {
  r.pending[e] !== void 0 && (delete r.pending[e], r.pendingCount--);
};
class ze extends Z {
  constructor(e, t, n) {
    var s, o;
    let i = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    (super(),
      (this.backend = e),
      (this.store = t),
      (this.services = n),
      (this.languageUtils = n.languageUtils),
      (this.options = i),
      (this.logger = R.create("backendConnector")),
      (this.waitingReads = []),
      (this.maxParallelReads = i.maxParallelReads || 10),
      (this.readingCalls = 0),
      (this.maxRetries = i.maxRetries >= 0 ? i.maxRetries : 5),
      (this.retryTimeout = i.retryTimeout >= 1 ? i.retryTimeout : 350),
      (this.state = {}),
      (this.queue = []),
      (o = (s = this.backend) == null ? void 0 : s.init) == null ||
        o.call(s, n, i.backend, i));
  }
  queueLoad(e, t, n, i) {
    const s = {},
      o = {},
      a = {},
      l = {};
    return (
      e.forEach((u) => {
        let c = !0;
        (t.forEach((g) => {
          const d = `${u}|${g}`;
          !n.reload && this.store.hasResourceBundle(u, g)
            ? (this.state[d] = 2)
            : this.state[d] < 0 ||
              (this.state[d] === 1
                ? o[d] === void 0 && (o[d] = !0)
                : ((this.state[d] = 1),
                  (c = !1),
                  o[d] === void 0 && (o[d] = !0),
                  s[d] === void 0 && (s[d] = !0),
                  l[g] === void 0 && (l[g] = !0)));
        }),
          c || (a[u] = !0));
      }),
      (Object.keys(s).length || Object.keys(o).length) &&
        this.queue.push({
          pending: o,
          pendingCount: Object.keys(o).length,
          loaded: {},
          errors: [],
          callback: i,
        }),
      {
        toLoad: Object.keys(s),
        pending: Object.keys(o),
        toLoadLanguages: Object.keys(a),
        toLoadNamespaces: Object.keys(l),
      }
    );
  }
  loaded(e, t, n) {
    const i = e.split("|"),
      s = i[0],
      o = i[1];
    (t && this.emit("failedLoading", s, o, t),
      !t &&
        n &&
        this.store.addResourceBundle(s, o, n, void 0, void 0, { skipCopy: !0 }),
      (this.state[e] = t ? -1 : 2),
      t && n && (this.state[e] = 0));
    const a = {};
    (this.queue.forEach((l) => {
      (Te(l.loaded, [s], o),
        Be(l, e),
        t && l.errors.push(t),
        l.pendingCount === 0 &&
          !l.done &&
          (Object.keys(l.loaded).forEach((u) => {
            a[u] || (a[u] = {});
            const c = l.loaded[u];
            c.length &&
              c.forEach((g) => {
                a[u][g] === void 0 && (a[u][g] = !0);
              });
          }),
          (l.done = !0),
          l.errors.length ? l.callback(l.errors) : l.callback()));
    }),
      this.emit("loaded", a),
      (this.queue = this.queue.filter((l) => !l.done)));
  }
  read(e, t, n) {
    let i = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0,
      s =
        arguments.length > 4 && arguments[4] !== void 0
          ? arguments[4]
          : this.retryTimeout,
      o = arguments.length > 5 ? arguments[5] : void 0;
    if (!e.length) return o(null, {});
    if (this.readingCalls >= this.maxParallelReads) {
      this.waitingReads.push({
        lng: e,
        ns: t,
        fcName: n,
        tried: i,
        wait: s,
        callback: o,
      });
      return;
    }
    this.readingCalls++;
    const a = (u, c) => {
        if ((this.readingCalls--, this.waitingReads.length > 0)) {
          const g = this.waitingReads.shift();
          this.read(g.lng, g.ns, g.fcName, g.tried, g.wait, g.callback);
        }
        if (u && c && i < this.maxRetries) {
          setTimeout(() => {
            this.read.call(this, e, t, n, i + 1, s * 2, o);
          }, s);
          return;
        }
        o(u, c);
      },
      l = this.backend[n].bind(this.backend);
    if (l.length === 2) {
      try {
        const u = l(e, t);
        u && typeof u.then == "function"
          ? u.then((c) => a(null, c)).catch(a)
          : a(null, u);
      } catch (u) {
        a(u);
      }
      return;
    }
    return l(e, t, a);
  }
  prepareLoading(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {},
      i = arguments.length > 3 ? arguments[3] : void 0;
    if (!this.backend)
      return (
        this.logger.warn(
          "No backend was added via i18next.use. Will not load resources.",
        ),
        i && i()
      );
    (f(e) && (e = this.languageUtils.toResolveHierarchy(e)), f(t) && (t = [t]));
    const s = this.queueLoad(e, t, n, i);
    if (!s.toLoad.length) return (s.pending.length || i(), null);
    s.toLoad.forEach((o) => {
      this.loadOne(o);
    });
  }
  load(e, t, n) {
    this.prepareLoading(e, t, {}, n);
  }
  reload(e, t, n) {
    this.prepareLoading(e, t, { reload: !0 }, n);
  }
  loadOne(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
    const n = e.split("|"),
      i = n[0],
      s = n[1];
    this.read(i, s, "read", void 0, void 0, (o, a) => {
      (o &&
        this.logger.warn(
          `${t}loading namespace ${s} for language ${i} failed`,
          o,
        ),
        !o &&
          a &&
          this.logger.log(`${t}loaded namespace ${s} for language ${i}`, a),
        this.loaded(e, o, a));
    });
  }
  saveMissing(e, t, n, i, s) {
    var l, u, c, g, d;
    let o = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {},
      a =
        arguments.length > 6 && arguments[6] !== void 0
          ? arguments[6]
          : () => {};
    if (
      (u = (l = this.services) == null ? void 0 : l.utils) != null &&
      u.hasLoadedNamespace &&
      !(
        (g = (c = this.services) == null ? void 0 : c.utils) != null &&
        g.hasLoadedNamespace(t)
      )
    ) {
      this.logger.warn(
        `did not save key "${n}" as the namespace "${t}" was not yet loaded`,
        "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!",
      );
      return;
    }
    if (!(n == null || n === "")) {
      if ((d = this.backend) != null && d.create) {
        const m = { ...o, isUpdate: s },
          h = this.backend.create.bind(this.backend);
        if (h.length < 6)
          try {
            let p;
            (h.length === 5 ? (p = h(e, t, n, i, m)) : (p = h(e, t, n, i)),
              p && typeof p.then == "function"
                ? p.then((y) => a(null, y)).catch(a)
                : a(null, p));
          } catch (p) {
            a(p);
          }
        else h(e, t, n, i, a, m);
      }
      !e || !e[0] || this.store.addResource(e[0], t, n, i);
    }
  }
}
const pe = () => ({
    debug: !1,
    initAsync: !0,
    ns: ["translation"],
    defaultNS: ["translation"],
    fallbackLng: ["dev"],
    fallbackNS: !1,
    supportedLngs: !1,
    nonExplicitSupportedLngs: !1,
    load: "all",
    preload: !1,
    simplifyPluralSuffix: !0,
    keySeparator: ".",
    nsSeparator: ":",
    pluralSeparator: "_",
    contextSeparator: "_",
    partialBundledLanguages: !1,
    saveMissing: !1,
    updateMissing: !1,
    saveMissingTo: "fallback",
    saveMissingPlurals: !0,
    missingKeyHandler: !1,
    missingInterpolationHandler: !1,
    postProcess: !1,
    postProcessPassResolved: !1,
    returnNull: !1,
    returnEmptyString: !0,
    returnObjects: !1,
    joinArrays: !1,
    returnedObjectHandler: !1,
    parseMissingKeyHandler: !1,
    appendNamespaceToMissingKey: !1,
    appendNamespaceToCIMode: !1,
    overloadTranslationOptionHandler: (r) => {
      let e = {};
      if (
        (typeof r[1] == "object" && (e = r[1]),
        f(r[1]) && (e.defaultValue = r[1]),
        f(r[2]) && (e.tDescription = r[2]),
        typeof r[2] == "object" || typeof r[3] == "object")
      ) {
        const t = r[3] || r[2];
        Object.keys(t).forEach((n) => {
          e[n] = t[n];
        });
      }
      return e;
    },
    interpolation: {
      escapeValue: !0,
      format: (r) => r,
      prefix: "{{",
      suffix: "}}",
      formatSeparator: ",",
      unescapePrefix: "-",
      nestingPrefix: "$t(",
      nestingSuffix: ")",
      nestingOptionsSeparator: ",",
      maxReplaces: 1e3,
      skipOnVariables: !0,
    },
  }),
  me = (r) => {
    var e, t;
    return (
      f(r.ns) && (r.ns = [r.ns]),
      f(r.fallbackLng) && (r.fallbackLng = [r.fallbackLng]),
      f(r.fallbackNS) && (r.fallbackNS = [r.fallbackNS]),
      ((t = (e = r.supportedLngs) == null ? void 0 : e.indexOf) == null
        ? void 0
        : t.call(e, "cimode")) < 0 &&
        (r.supportedLngs = r.supportedLngs.concat(["cimode"])),
      typeof r.initImmediate == "boolean" && (r.initAsync = r.initImmediate),
      r
    );
  },
  W = () => {},
  We = (r) => {
    Object.getOwnPropertyNames(Object.getPrototypeOf(r)).forEach((t) => {
      typeof r[t] == "function" && (r[t] = r[t].bind(r));
    });
  };
class B extends Z {
  constructor() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      t = arguments.length > 1 ? arguments[1] : void 0;
    if (
      (super(),
      (this.options = me(e)),
      (this.services = {}),
      (this.logger = R),
      (this.modules = { external: [] }),
      We(this),
      t && !this.isInitialized && !e.isClone)
    ) {
      if (!this.options.initAsync) return (this.init(e, t), this);
      setTimeout(() => {
        this.init(e, t);
      }, 0);
    }
  }
  init() {
    var e = this;
    let t = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      n = arguments.length > 1 ? arguments[1] : void 0;
    ((this.isInitializing = !0),
      typeof t == "function" && ((n = t), (t = {})),
      t.defaultNS == null &&
        t.ns &&
        (f(t.ns)
          ? (t.defaultNS = t.ns)
          : t.ns.indexOf("translation") < 0 && (t.defaultNS = t.ns[0])));
    const i = pe();
    ((this.options = { ...i, ...this.options, ...me(t) }),
      (this.options.interpolation = {
        ...i.interpolation,
        ...this.options.interpolation,
      }),
      t.keySeparator !== void 0 &&
        (this.options.userDefinedKeySeparator = t.keySeparator),
      t.nsSeparator !== void 0 &&
        (this.options.userDefinedNsSeparator = t.nsSeparator));
    const s = (c) => (c ? (typeof c == "function" ? new c() : c) : null);
    if (!this.options.isClone) {
      this.modules.logger
        ? R.init(s(this.modules.logger), this.options)
        : R.init(null, this.options);
      let c;
      this.modules.formatter ? (c = this.modules.formatter) : (c = He);
      const g = new ce(this.options);
      this.store = new le(this.options.resources, this.options);
      const d = this.services;
      ((d.logger = R),
        (d.resourceStore = this.store),
        (d.languageUtils = g),
        (d.pluralResolver = new Ve(g, {
          prepend: this.options.pluralSeparator,
          simplifyPluralSuffix: this.options.simplifyPluralSuffix,
        })),
        c &&
          (!this.options.interpolation.format ||
            this.options.interpolation.format === i.interpolation.format) &&
          ((d.formatter = s(c)),
          d.formatter.init(d, this.options),
          (this.options.interpolation.format = d.formatter.format.bind(
            d.formatter,
          ))),
        (d.interpolator = new Me(this.options)),
        (d.utils = { hasLoadedNamespace: this.hasLoadedNamespace.bind(this) }),
        (d.backendConnector = new ze(
          s(this.modules.backend),
          d.resourceStore,
          d,
          this.options,
        )),
        d.backendConnector.on("*", function (m) {
          for (
            var h = arguments.length, p = new Array(h > 1 ? h - 1 : 0), y = 1;
            y < h;
            y++
          )
            p[y - 1] = arguments[y];
          e.emit(m, ...p);
        }),
        this.modules.languageDetector &&
          ((d.languageDetector = s(this.modules.languageDetector)),
          d.languageDetector.init &&
            d.languageDetector.init(d, this.options.detection, this.options)),
        this.modules.i18nFormat &&
          ((d.i18nFormat = s(this.modules.i18nFormat)),
          d.i18nFormat.init && d.i18nFormat.init(this)),
        (this.translator = new Q(this.services, this.options)),
        this.translator.on("*", function (m) {
          for (
            var h = arguments.length, p = new Array(h > 1 ? h - 1 : 0), y = 1;
            y < h;
            y++
          )
            p[y - 1] = arguments[y];
          e.emit(m, ...p);
        }),
        this.modules.external.forEach((m) => {
          m.init && m.init(this);
        }));
    }
    if (
      ((this.format = this.options.interpolation.format),
      n || (n = W),
      this.options.fallbackLng &&
        !this.services.languageDetector &&
        !this.options.lng)
    ) {
      const c = this.services.languageUtils.getFallbackCodes(
        this.options.fallbackLng,
      );
      c.length > 0 && c[0] !== "dev" && (this.options.lng = c[0]);
    }
    (!this.services.languageDetector &&
      !this.options.lng &&
      this.logger.warn(
        "init: no languageDetector is used and no lng is defined",
      ),
      [
        "getResource",
        "hasResourceBundle",
        "getResourceBundle",
        "getDataByLanguage",
      ].forEach((c) => {
        this[c] = function () {
          return e.store[c](...arguments);
        };
      }),
      [
        "addResource",
        "addResources",
        "addResourceBundle",
        "removeResourceBundle",
      ].forEach((c) => {
        this[c] = function () {
          return (e.store[c](...arguments), e);
        };
      }));
    const l = G(),
      u = () => {
        const c = (g, d) => {
          ((this.isInitializing = !1),
            this.isInitialized &&
              !this.initializedStoreOnce &&
              this.logger.warn(
                "init: i18next is already initialized. You should call init just once!",
              ),
            (this.isInitialized = !0),
            this.options.isClone ||
              this.logger.log("initialized", this.options),
            this.emit("initialized", this.options),
            l.resolve(d),
            n(g, d));
        };
        if (this.languages && !this.isInitialized)
          return c(null, this.t.bind(this));
        this.changeLanguage(this.options.lng, c);
      };
    return (
      this.options.resources || !this.options.initAsync
        ? u()
        : setTimeout(u, 0),
      l
    );
  }
  loadResources(e) {
    var s, o;
    let n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : W;
    const i = f(e) ? e : this.language;
    if (
      (typeof e == "function" && (n = e),
      !this.options.resources || this.options.partialBundledLanguages)
    ) {
      if (
        (i == null ? void 0 : i.toLowerCase()) === "cimode" &&
        (!this.options.preload || this.options.preload.length === 0)
      )
        return n();
      const a = [],
        l = (u) => {
          if (!u || u === "cimode") return;
          this.services.languageUtils.toResolveHierarchy(u).forEach((g) => {
            g !== "cimode" && a.indexOf(g) < 0 && a.push(g);
          });
        };
      (i
        ? l(i)
        : this.services.languageUtils
            .getFallbackCodes(this.options.fallbackLng)
            .forEach((c) => l(c)),
        (o = (s = this.options.preload) == null ? void 0 : s.forEach) == null ||
          o.call(s, (u) => l(u)),
        this.services.backendConnector.load(a, this.options.ns, (u) => {
          (!u &&
            !this.resolvedLanguage &&
            this.language &&
            this.setResolvedLanguage(this.language),
            n(u));
        }));
    } else n(null);
  }
  reloadResources(e, t, n) {
    const i = G();
    return (
      typeof e == "function" && ((n = e), (e = void 0)),
      typeof t == "function" && ((n = t), (t = void 0)),
      e || (e = this.languages),
      t || (t = this.options.ns),
      n || (n = W),
      this.services.backendConnector.reload(e, t, (s) => {
        (i.resolve(), n(s));
      }),
      i
    );
  }
  use(e) {
    if (!e)
      throw new Error(
        "You are passing an undefined module! Please check the object you are passing to i18next.use()",
      );
    if (!e.type)
      throw new Error(
        "You are passing a wrong module! Please check the object you are passing to i18next.use()",
      );
    return (
      e.type === "backend" && (this.modules.backend = e),
      (e.type === "logger" || (e.log && e.warn && e.error)) &&
        (this.modules.logger = e),
      e.type === "languageDetector" && (this.modules.languageDetector = e),
      e.type === "i18nFormat" && (this.modules.i18nFormat = e),
      e.type === "postProcessor" && ve.addPostProcessor(e),
      e.type === "formatter" && (this.modules.formatter = e),
      e.type === "3rdParty" && this.modules.external.push(e),
      this
    );
  }
  setResolvedLanguage(e) {
    if (!(!e || !this.languages) && !(["cimode", "dev"].indexOf(e) > -1))
      for (let t = 0; t < this.languages.length; t++) {
        const n = this.languages[t];
        if (
          !(["cimode", "dev"].indexOf(n) > -1) &&
          this.store.hasLanguageSomeTranslations(n)
        ) {
          this.resolvedLanguage = n;
          break;
        }
      }
  }
  changeLanguage(e, t) {
    var n = this;
    this.isLanguageChangingTo = e;
    const i = G();
    this.emit("languageChanging", e);
    const s = (l) => {
        ((this.language = l),
          (this.languages = this.services.languageUtils.toResolveHierarchy(l)),
          (this.resolvedLanguage = void 0),
          this.setResolvedLanguage(l));
      },
      o = (l, u) => {
        (u
          ? (s(u),
            this.translator.changeLanguage(u),
            (this.isLanguageChangingTo = void 0),
            this.emit("languageChanged", u),
            this.logger.log("languageChanged", u))
          : (this.isLanguageChangingTo = void 0),
          i.resolve(function () {
            return n.t(...arguments);
          }),
          t &&
            t(l, function () {
              return n.t(...arguments);
            }));
      },
      a = (l) => {
        var c, g;
        !e && !l && this.services.languageDetector && (l = []);
        const u = f(l)
          ? l
          : this.services.languageUtils.getBestMatchFromCodes(l);
        (u &&
          (this.language || s(u),
          this.translator.language || this.translator.changeLanguage(u),
          (g =
            (c = this.services.languageDetector) == null
              ? void 0
              : c.cacheUserLanguage) == null || g.call(c, u)),
          this.loadResources(u, (d) => {
            o(d, u);
          }));
      };
    return (
      !e &&
      this.services.languageDetector &&
      !this.services.languageDetector.async
        ? a(this.services.languageDetector.detect())
        : !e &&
            this.services.languageDetector &&
            this.services.languageDetector.async
          ? this.services.languageDetector.detect.length === 0
            ? this.services.languageDetector.detect().then(a)
            : this.services.languageDetector.detect(a)
          : a(e),
      i
    );
  }
  getFixedT(e, t, n) {
    var i = this;
    const s = function (o, a) {
      let l;
      if (typeof a != "object") {
        for (
          var u = arguments.length, c = new Array(u > 2 ? u - 2 : 0), g = 2;
          g < u;
          g++
        )
          c[g - 2] = arguments[g];
        l = i.options.overloadTranslationOptionHandler([o, a].concat(c));
      } else l = { ...a };
      ((l.lng = l.lng || s.lng),
        (l.lngs = l.lngs || s.lngs),
        (l.ns = l.ns || s.ns),
        l.keyPrefix !== "" && (l.keyPrefix = l.keyPrefix || n || s.keyPrefix));
      const d = i.options.keySeparator || ".";
      let m;
      return (
        l.keyPrefix && Array.isArray(o)
          ? (m = o.map((h) => `${l.keyPrefix}${d}${h}`))
          : (m = l.keyPrefix ? `${l.keyPrefix}${d}${o}` : o),
        i.t(m, l)
      );
    };
    return (
      f(e) ? (s.lng = e) : (s.lngs = e),
      (s.ns = t),
      (s.keyPrefix = n),
      s
    );
  }
  t() {
    var i;
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
      t[n] = arguments[n];
    return (i = this.translator) == null ? void 0 : i.translate(...t);
  }
  exists() {
    var i;
    for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
      t[n] = arguments[n];
    return (i = this.translator) == null ? void 0 : i.exists(...t);
  }
  setDefaultNamespace(e) {
    this.options.defaultNS = e;
  }
  hasLoadedNamespace(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (!this.isInitialized)
      return (
        this.logger.warn(
          "hasLoadedNamespace: i18next was not initialized",
          this.languages,
        ),
        !1
      );
    if (!this.languages || !this.languages.length)
      return (
        this.logger.warn(
          "hasLoadedNamespace: i18n.languages were undefined or empty",
          this.languages,
        ),
        !1
      );
    const n = t.lng || this.resolvedLanguage || this.languages[0],
      i = this.options ? this.options.fallbackLng : !1,
      s = this.languages[this.languages.length - 1];
    if (n.toLowerCase() === "cimode") return !0;
    const o = (a, l) => {
      const u = this.services.backendConnector.state[`${a}|${l}`];
      return u === -1 || u === 0 || u === 2;
    };
    if (t.precheck) {
      const a = t.precheck(this, o);
      if (a !== void 0) return a;
    }
    return !!(
      this.hasResourceBundle(n, e) ||
      !this.services.backendConnector.backend ||
      (this.options.resources && !this.options.partialBundledLanguages) ||
      (o(n, e) && (!i || o(s, e)))
    );
  }
  loadNamespaces(e, t) {
    const n = G();
    return this.options.ns
      ? (f(e) && (e = [e]),
        e.forEach((i) => {
          this.options.ns.indexOf(i) < 0 && this.options.ns.push(i);
        }),
        this.loadResources((i) => {
          (n.resolve(), t && t(i));
        }),
        n)
      : (t && t(), Promise.resolve());
  }
  loadLanguages(e, t) {
    const n = G();
    f(e) && (e = [e]);
    const i = this.options.preload || [],
      s = e.filter(
        (o) =>
          i.indexOf(o) < 0 && this.services.languageUtils.isSupportedCode(o),
      );
    return s.length
      ? ((this.options.preload = i.concat(s)),
        this.loadResources((o) => {
          (n.resolve(), t && t(o));
        }),
        n)
      : (t && t(), Promise.resolve());
  }
  dir(e) {
    var i, s;
    if (
      (e ||
        (e =
          this.resolvedLanguage ||
          (((i = this.languages) == null ? void 0 : i.length) > 0
            ? this.languages[0]
            : this.language)),
      !e)
    )
      return "rtl";
    const t = [
        "ar",
        "shu",
        "sqr",
        "ssh",
        "xaa",
        "yhd",
        "yud",
        "aao",
        "abh",
        "abv",
        "acm",
        "acq",
        "acw",
        "acx",
        "acy",
        "adf",
        "ads",
        "aeb",
        "aec",
        "afb",
        "ajp",
        "apc",
        "apd",
        "arb",
        "arq",
        "ars",
        "ary",
        "arz",
        "auz",
        "avl",
        "ayh",
        "ayl",
        "ayn",
        "ayp",
        "bbz",
        "pga",
        "he",
        "iw",
        "ps",
        "pbt",
        "pbu",
        "pst",
        "prp",
        "prd",
        "ug",
        "ur",
        "ydd",
        "yds",
        "yih",
        "ji",
        "yi",
        "hbo",
        "men",
        "xmn",
        "fa",
        "jpr",
        "peo",
        "pes",
        "prs",
        "dv",
        "sam",
        "ckb",
      ],
      n =
        ((s = this.services) == null ? void 0 : s.languageUtils) ||
        new ce(pe());
    return t.indexOf(n.getLanguagePartFromCode(e)) > -1 ||
      e.toLowerCase().indexOf("-arab") > 1
      ? "rtl"
      : "ltr";
  }
  static createInstance() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      t = arguments.length > 1 ? arguments[1] : void 0;
    return new B(e, t);
  }
  cloneInstance() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
      t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : W;
    const n = e.forkResourceStore;
    n && delete e.forkResourceStore;
    const i = { ...this.options, ...e, isClone: !0 },
      s = new B(i);
    if (
      ((e.debug !== void 0 || e.prefix !== void 0) &&
        (s.logger = s.logger.clone(e)),
      ["store", "services", "language"].forEach((a) => {
        s[a] = this[a];
      }),
      (s.services = { ...this.services }),
      (s.services.utils = { hasLoadedNamespace: s.hasLoadedNamespace.bind(s) }),
      n)
    ) {
      const a = Object.keys(this.store.data).reduce(
        (l, u) => (
          (l[u] = { ...this.store.data[u] }),
          Object.keys(l[u]).reduce((c, g) => ((c[g] = { ...l[u][g] }), c), {})
        ),
        {},
      );
      ((s.store = new le(a, i)), (s.services.resourceStore = s.store));
    }
    return (
      (s.translator = new Q(s.services, i)),
      s.translator.on("*", function (a) {
        for (
          var l = arguments.length, u = new Array(l > 1 ? l - 1 : 0), c = 1;
          c < l;
          c++
        )
          u[c - 1] = arguments[c];
        s.emit(a, ...u);
      }),
      s.init(i, t),
      (s.translator.options = i),
      (s.translator.backendConnector.services.utils = {
        hasLoadedNamespace: s.hasLoadedNamespace.bind(s),
      }),
      s
    );
  }
  toJSON() {
    return {
      options: this.options,
      store: this.store,
      language: this.language,
      languages: this.languages,
      resolvedLanguage: this.resolvedLanguage,
    };
  }
}
const x = B.createInstance();
x.createInstance = B.createInstance;
x.createInstance;
x.dir;
x.init;
x.loadResources;
x.reloadResources;
x.use;
x.changeLanguage;
x.getFixedT;
x.t;
x.exists;
x.setDefaultNamespace;
x.hasLoadedNamespace;
x.loadNamespaces;
x.loadLanguages;
const { slice: Je, forEach: qe } = [];
function Ye(r) {
  return (
    qe.call(Je.call(arguments, 1), (e) => {
      if (e) for (const t in e) r[t] === void 0 && (r[t] = e[t]);
    }),
    r
  );
}
function Qe(r) {
  return typeof r != "string"
    ? !1
    : [
        /<\s*script.*?>/i,
        /<\s*\/\s*script\s*>/i,
        /<\s*img.*?on\w+\s*=/i,
        /<\s*\w+\s*on\w+\s*=.*?>/i,
        /javascript\s*:/i,
        /vbscript\s*:/i,
        /expression\s*\(/i,
        /eval\s*\(/i,
        /alert\s*\(/i,
        /document\.cookie/i,
        /document\.write\s*\(/i,
        /window\.location/i,
        /innerHTML/i,
      ].some((t) => t.test(r));
}
const ye = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/,
  Ze = function (r, e) {
    const n =
        arguments.length > 2 && arguments[2] !== void 0
          ? arguments[2]
          : { path: "/" },
      i = encodeURIComponent(e);
    let s = `${r}=${i}`;
    if (n.maxAge > 0) {
      const o = n.maxAge - 0;
      if (Number.isNaN(o)) throw new Error("maxAge should be a Number");
      s += `; Max-Age=${Math.floor(o)}`;
    }
    if (n.domain) {
      if (!ye.test(n.domain)) throw new TypeError("option domain is invalid");
      s += `; Domain=${n.domain}`;
    }
    if (n.path) {
      if (!ye.test(n.path)) throw new TypeError("option path is invalid");
      s += `; Path=${n.path}`;
    }
    if (n.expires) {
      if (typeof n.expires.toUTCString != "function")
        throw new TypeError("option expires is invalid");
      s += `; Expires=${n.expires.toUTCString()}`;
    }
    if (
      (n.httpOnly && (s += "; HttpOnly"),
      n.secure && (s += "; Secure"),
      n.sameSite)
    )
      switch (
        typeof n.sameSite == "string" ? n.sameSite.toLowerCase() : n.sameSite
      ) {
        case !0:
          s += "; SameSite=Strict";
          break;
        case "lax":
          s += "; SameSite=Lax";
          break;
        case "strict":
          s += "; SameSite=Strict";
          break;
        case "none":
          s += "; SameSite=None";
          break;
        default:
          throw new TypeError("option sameSite is invalid");
      }
    return (n.partitioned && (s += "; Partitioned"), s);
  },
  be = {
    create(r, e, t, n) {
      let i =
        arguments.length > 4 && arguments[4] !== void 0
          ? arguments[4]
          : { path: "/", sameSite: "strict" };
      (t &&
        ((i.expires = new Date()),
        i.expires.setTime(i.expires.getTime() + t * 60 * 1e3)),
        n && (i.domain = n),
        (document.cookie = Ze(r, e, i)));
    },
    read(r) {
      const e = `${r}=`,
        t = document.cookie.split(";");
      for (let n = 0; n < t.length; n++) {
        let i = t[n];
        for (; i.charAt(0) === " "; ) i = i.substring(1, i.length);
        if (i.indexOf(e) === 0) return i.substring(e.length, i.length);
      }
      return null;
    },
    remove(r, e) {
      this.create(r, "", -1, e);
    },
  };
var Xe = {
    name: "cookie",
    lookup(r) {
      let { lookupCookie: e } = r;
      if (e && typeof document < "u") return be.read(e) || void 0;
    },
    cacheUserLanguage(r, e) {
      let {
        lookupCookie: t,
        cookieMinutes: n,
        cookieDomain: i,
        cookieOptions: s,
      } = e;
      t && typeof document < "u" && be.create(t, r, n, i, s);
    },
  },
  _e = {
    name: "querystring",
    lookup(r) {
      var n;
      let { lookupQuerystring: e } = r,
        t;
      if (typeof window < "u") {
        let { search: i } = window.location;
        !window.location.search &&
          ((n = window.location.hash) == null ? void 0 : n.indexOf("?")) > -1 &&
          (i = window.location.hash.substring(
            window.location.hash.indexOf("?"),
          ));
        const o = i.substring(1).split("&");
        for (let a = 0; a < o.length; a++) {
          const l = o[a].indexOf("=");
          l > 0 && o[a].substring(0, l) === e && (t = o[a].substring(l + 1));
        }
      }
      return t;
    },
  },
  et = {
    name: "hash",
    lookup(r) {
      var i;
      let { lookupHash: e, lookupFromHashIndex: t } = r,
        n;
      if (typeof window < "u") {
        const { hash: s } = window.location;
        if (s && s.length > 2) {
          const o = s.substring(1);
          if (e) {
            const a = o.split("&");
            for (let l = 0; l < a.length; l++) {
              const u = a[l].indexOf("=");
              u > 0 &&
                a[l].substring(0, u) === e &&
                (n = a[l].substring(u + 1));
            }
          }
          if (n) return n;
          if (!n && t > -1) {
            const a = s.match(/\/([a-zA-Z-]*)/g);
            return Array.isArray(a)
              ? (i = a[typeof t == "number" ? t : 0]) == null
                ? void 0
                : i.replace("/", "")
              : void 0;
          }
        }
      }
      return n;
    },
  };
let F = null;
const xe = () => {
  if (F !== null) return F;
  try {
    if (((F = typeof window < "u" && window.localStorage !== null), !F))
      return !1;
    const r = "i18next.translate.boo";
    (window.localStorage.setItem(r, "foo"), window.localStorage.removeItem(r));
  } catch {
    F = !1;
  }
  return F;
};
var tt = {
  name: "localStorage",
  lookup(r) {
    let { lookupLocalStorage: e } = r;
    if (e && xe()) return window.localStorage.getItem(e) || void 0;
  },
  cacheUserLanguage(r, e) {
    let { lookupLocalStorage: t } = e;
    t && xe() && window.localStorage.setItem(t, r);
  },
};
let U = null;
const Se = () => {
  if (U !== null) return U;
  try {
    if (((U = typeof window < "u" && window.sessionStorage !== null), !U))
      return !1;
    const r = "i18next.translate.boo";
    (window.sessionStorage.setItem(r, "foo"),
      window.sessionStorage.removeItem(r));
  } catch {
    U = !1;
  }
  return U;
};
var nt = {
    name: "sessionStorage",
    lookup(r) {
      let { lookupSessionStorage: e } = r;
      if (e && Se()) return window.sessionStorage.getItem(e) || void 0;
    },
    cacheUserLanguage(r, e) {
      let { lookupSessionStorage: t } = e;
      t && Se() && window.sessionStorage.setItem(t, r);
    },
  },
  it = {
    name: "navigator",
    lookup(r) {
      const e = [];
      if (typeof navigator < "u") {
        const { languages: t, userLanguage: n, language: i } = navigator;
        if (t) for (let s = 0; s < t.length; s++) e.push(t[s]);
        (n && e.push(n), i && e.push(i));
      }
      return e.length > 0 ? e : void 0;
    },
  },
  st = {
    name: "htmlTag",
    lookup(r) {
      let { htmlTag: e } = r,
        t;
      const n = e || (typeof document < "u" ? document.documentElement : null);
      return (
        n &&
          typeof n.getAttribute == "function" &&
          (t = n.getAttribute("lang")),
        t
      );
    },
  },
  rt = {
    name: "path",
    lookup(r) {
      var i;
      let { lookupFromPathIndex: e } = r;
      if (typeof window > "u") return;
      const t = window.location.pathname.match(/\/([a-zA-Z-]*)/g);
      return Array.isArray(t)
        ? (i = t[typeof e == "number" ? e : 0]) == null
          ? void 0
          : i.replace("/", "")
        : void 0;
    },
  },
  ot = {
    name: "subdomain",
    lookup(r) {
      var i, s;
      let { lookupFromSubdomainIndex: e } = r;
      const t = typeof e == "number" ? e + 1 : 1,
        n =
          typeof window < "u" &&
          ((s = (i = window.location) == null ? void 0 : i.hostname) == null
            ? void 0
            : s.match(
                /^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i,
              ));
      if (n) return n[t];
    },
  };
let Ce = !1;
try {
  (document.cookie, (Ce = !0));
} catch {}
const Pe = [
  "querystring",
  "cookie",
  "localStorage",
  "sessionStorage",
  "navigator",
  "htmlTag",
];
Ce || Pe.splice(1, 1);
const at = () => ({
  order: Pe,
  lookupQuerystring: "lng",
  lookupCookie: "i18next",
  lookupLocalStorage: "i18nextLng",
  lookupSessionStorage: "i18nextLng",
  caches: ["localStorage"],
  excludeCacheFor: ["cimode"],
  convertDetectedLanguage: (r) => r,
});
class ke {
  constructor(e) {
    let t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    ((this.type = "languageDetector"), (this.detectors = {}), this.init(e, t));
  }
  init() {
    let e =
        arguments.length > 0 && arguments[0] !== void 0
          ? arguments[0]
          : { languageUtils: {} },
      t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
      n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    ((this.services = e),
      (this.options = Ye(t, this.options || {}, at())),
      typeof this.options.convertDetectedLanguage == "string" &&
        this.options.convertDetectedLanguage.indexOf("15897") > -1 &&
        (this.options.convertDetectedLanguage = (i) => i.replace("-", "_")),
      this.options.lookupFromUrlIndex &&
        (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
      (this.i18nOptions = n),
      this.addDetector(Xe),
      this.addDetector(_e),
      this.addDetector(tt),
      this.addDetector(nt),
      this.addDetector(it),
      this.addDetector(st),
      this.addDetector(rt),
      this.addDetector(ot),
      this.addDetector(et));
  }
  addDetector(e) {
    return ((this.detectors[e.name] = e), this);
  }
  detect() {
    let e =
        arguments.length > 0 && arguments[0] !== void 0
          ? arguments[0]
          : this.options.order,
      t = [];
    return (
      e.forEach((n) => {
        if (this.detectors[n]) {
          let i = this.detectors[n].lookup(this.options);
          (i && typeof i == "string" && (i = [i]), i && (t = t.concat(i)));
        }
      }),
      (t = t
        .filter((n) => n != null && !Qe(n))
        .map((n) => this.options.convertDetectedLanguage(n))),
      this.services &&
      this.services.languageUtils &&
      this.services.languageUtils.getBestMatchFromCodes
        ? t
        : t.length > 0
          ? t[0]
          : null
    );
  }
  cacheUserLanguage(e) {
    let t =
      arguments.length > 1 && arguments[1] !== void 0
        ? arguments[1]
        : this.options.caches;
    t &&
      ((this.options.excludeCacheFor &&
        this.options.excludeCacheFor.indexOf(e) > -1) ||
        t.forEach((n) => {
          this.detectors[n] &&
            this.detectors[n].cacheUserLanguage(e, this.options);
        }));
  }
}
ke.type = "languageDetector";
const lt = { title: "灰豆AI漫剧", subtitle: "AI Comics Creator" },
  ut = {
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    delete: "删除",
    edit: "编辑",
    close: "关闭",
    loading: "加载中...",
    error: "错误",
    success: "成功",
  },
  dt = { dark: "深色", light: "浅色" },
  ct = {
    back: "返回",
    switchToEnglish: "English",
    switchToChinese: "中文",
    minimize: "最小化",
    maximize: "最大化",
    close: "关闭",
  },
  gt = {
    addImage: "添加图片",
    splitStoryboard: "切割",
    generate: "生成",
    emptyHintTitle: "双击鼠标添加节点",
    emptyHintSubtitle: "Double-click to add a node",
    toolbar: {
      zoomIn: "放大",
      zoomOut: "缩小",
      fitView: "适应视图",
      lock: "锁定画布",
      unlock: "解锁画布",
    },
  },
  ht = { crop: "裁剪", annotate: "标注", split: "切割" },
  ft = {
    suffix: "工具",
    noProcessableImage: "当前节点没有可处理的图片",
    processFailed: "处理失败",
    processing: "处理中...",
    apply: "应用",
    cropResultTitle: "裁剪结果",
    annotateResultTitle: "标注结果",
  },
  pt = {
    reupload: "重新上传",
    copy: "复制",
    copyText: "复制文本",
    copyErrorReport: "复制报错",
    copied: "已复制",
    download: "下载",
    ungroup: "解散",
    saveAs: "另存为...",
    noDownloadPresetPathsHint: "暂无预设路径，请在设置 - 通用中添加",
    storyboardLine: "分镜 {{index}}：{{content}}",
  },
  mt = {
    provider: "供应商",
    model: "模型",
    providerKeyRequiredTitle: "需要配置供应商密钥",
    providerKeyRequiredDesc:
      "当前尚未配置 {{provider}} 的 API Key，请先到设置中完成配置后再使用该供应商。",
    goConfigure: "去配置",
    autoAspectRatio: "自动",
    quality: "画质",
    aspectRatio: "比例",
    enableWebSearch: "启用联网搜索",
    otherParams: "其他参数",
    extraOptions: "额外参数",
    thinkingLevel: "思考等级",
    thinkingLevelDesc: "仅对 fal 的 Nano Banana 2 生效；高思考会额外增加费用。",
    thinkingDisabled: "关闭",
    thinkingMinimal: "标准",
    thinkingHigh: "高",
  },
  yt = {
    menu: {
      uploadImage: "上传图片",
      aiImageGeneration: "AI生图",
      storyboard: "分镜",
      textAnnotation: "文本注释",
      storyboardGen: "分镜生成",
      vr360: "VR360全景",
      director3d: "3D导演台",
    },
  },
  bt = { imageAlt: "图片", prev: "上一张", next: "下一张", reset: "重置视图" },
  xt = {
    title: "切割",
    rows: "行数",
    cols: "列数",
    preview: "预览",
    split: "切割",
  },
  St = {
    provider: "AI 提供商",
    model: "模型",
    prompt: "提示词",
    generating: "生成中...",
    success: "生成成功",
    error: "生成失败",
  },
  wt = {
    title: "项目管理",
    newProject: "新建项目",
    newProjectTitle: "新建项目",
    open: "打开项目",
    save: "保存项目",
    name: "项目名称",
    namePlaceholder: "请输入项目名称",
    rename: "重命名",
    renameTitle: "重命名项目",
    delete: "删除项目",
    created: "创建时间",
    modified: "修改时间",
    updatedAt: "更新时间",
    sortBy: "排序字段",
    sortDirection: "排序顺序",
    sortByName: "按名称",
    sortByCreatedAt: "按创建日期",
    sortByUpdatedAt: "按修改日期",
    sortAsc: "升序",
    sortDesc: "降序",
    nodes: "节点数",
    noProjects: "暂无项目",
    empty: "暂无项目",
    emptyHint: "点击上方按钮创建新项目",
  },
  vt = {
    title: "设置",
    providers: "密钥",
    providersDesc: "配置 AI 服务商的 API 密钥",
    pricing: "价格",
    pricingDesc: "管理节点价格展示、汇率换算和积分套餐估算。",
    providerGuideText:
      "不同供应商在模型能力、队列速度、稳定性和价格上可能有差异。建议按当前任务场景切换供应商，并优先使用对应官方文档中的推荐参数。",
    doNotShowAgain: "不再显示",
    appearance: "外观",
    appearanceDesc: "自定义应用外观",
    experimental: "实验",
    experimentalDesc: "用于放置实验性质或低频使用的功能开关。",
    about: "关于",
    aboutDesc: "应用信息",
    general: "通用",
    generalDesc: "通用设置",
    apiKey: "API Key",
    model: "模型",
    enterApiKey: "输入 API Key",
    nanoBananaProModel: "Nano Banana Pro 接入模型",
    nanoBananaProModelDesc:
      "切换该供应商 Nano Banana Pro 的接入点，当一个接入点失效时可尝试切换，具体请查阅<modelListLink>模型列表</modelListLink>。",
    addProvider: "添加供应商",
    providerPpioName: "派欧云",
    comingSoon: "即将推出...",
    radiusPreset: "圆角大小",
    radiusPresetDesc: "控制面板、输入框与节点的全局圆角风格。",
    radiusCompact: "紧凑",
    radiusDefault: "默认",
    radiusLarge: "圆润",
    themeTone: "明暗色调",
    themeToneDesc: "为深浅主题选择中性、暖色或冷色倾向。",
    toneNeutral: "中性",
    toneWarm: "暖色",
    toneCool: "冷色",
    edgeRoutingMode: "连线样式",
    edgeRoutingModeDesc:
      "切换节点间连线路径风格，可选择自动避让节点的直角走线。",
    edgeRoutingSpline: "曲线",
    edgeRoutingOrthogonal: "直角",
    edgeRoutingSmartOrthogonal: "智能避让（直角）",
    accentColor: "强调色",
    accentColorDesc: "用于按钮、选中边框和交互高亮。",
    resetAccentColor: "恢复默认",
    downloadPresetPaths: "下载预设路径",
    downloadPresetPathsDesc:
      "用于节点工具条下载菜单中的快速保存目录（最多 8 个）",
    storyboardGenKeepStyleConsistent: "分镜图风格与参考图保持一致",
    storyboardGenKeepStyleConsistentDesc:
      "启用后，分镜生成提示词会追加“图片风格与参考图保持一致”。",
    storyboardGenDisableTextInImage: "分镜图禁止生成描述文本",
    storyboardGenDisableTextInImageDesc:
      "启用后，分镜生成提示词会追加“禁止添加描述文本”。",
    ignoreAtTagWhenCopyingAndGenerating: "复制/保存文本时忽略 @ 标签",
    ignoreAtTagWhenCopyingAndGeneratingDesc:
      "启用后，复制文本和写入图片分镜元数据时会忽略类似“@图1”的标签；发送生成请求时仅移除“@”并保留“图1”。",
    useUploadFilenameAsNodeTitle: "上传节点自动使用文件名作为标题",
    useUploadFilenameAsNodeTitleDesc:
      "启用后，新上传图片会默认使用文件名作为节点标题（仍可双击手动重命名）。",
    downloadPathPlaceholder:
      "输入目录路径，例如 /Users/name/Pictures/Storyboard 或 D:\\\\Images\\\\Storyboard",
    addPath: "添加路径",
    chooseFolder: "选择文件夹",
    noDownloadPresetPaths: "暂无预设路径",
    providerApiKeyGuidePrefix: "首先",
    providerRegisterLink: "点击这里注册",
    providerApiKeyGuideMiddle: "，然后",
    getApiKeyLink: "点击这里获取密钥",
    missingAnyApiKeyMessage: "您尚未配置任何密钥，请打开设置进行配置。",
    openProvidersSettings: "打开设置",
    aboutAppName: "灰豆AI漫剧",
    aboutIntro: "AI漫剧分镜创作工具，一站式完成场景构建与分镜制作。",
    aboutVersionLabel: "版本",
    aboutVersionUnknown: "未知",
    aboutAuthorLabel: "作者",
    aboutAuthor: "痕继痕迹",
    aboutRepositoryLabel: "项目仓库",
    autoCheckUpdateOnLaunch: "启动时自动检查更新",
    autoCheckUpdateOnLaunchDesc: "每次打开软件自动检查一次新版本。",
    enableUpdateDialog: "启用更新提示弹窗",
    enableUpdateDialogDesc: "检测到新版本时显示更新提示弹窗。",
    enableStoryboardGenGridPreviewShortcut: "启用分镜网格预览快捷键",
    enableStoryboardGenGridPreviewShortcutDesc:
      "启用后，在分镜生成节点按住 Ctrl + Alt + Shift 点击“生成”会直接输出网格预览图，不发送 AI 请求。",
    showStoryboardGenAdvancedRatioControls: "显示分镜比例高级控制",
    showStoryboardGenAdvancedRatioControlsDesc:
      "启用后显示单格/整体比例信息和“整体比/单格比”切换；关闭时默认按单格比逻辑运行。",
    storyboardGenAutoInferEmptyFrame: "空分镜自动推测",
    storyboardGenAutoInferEmptyFrameDesc:
      "启用后，分镜生成时如果某个格子没有填写内容，会自动追加“依据之前的内容进行推测”。",
    showNodePrice: "在节点右上角显示价格",
    showNodePriceDesc:
      "实时根据当前模型、分辨率和附加参数显示本次运行的预计消费。",
    priceDisplayCurrencyMode: "价格显示币种",
    priceDisplayCurrencyModeDesc:
      "自动模式下，中文界面显示人民币，英文界面显示美元。",
    priceCurrencyAuto: "自动跟随语言",
    priceCurrencyCny: "人民币",
    priceCurrencyUsd: "美元",
    usdToCnyRate: "美元兑人民币汇率",
    usdToCnyRateDesc:
      "用于在美元和人民币之间换算显示价格，不影响实际平台扣费。",
    preferDiscountedPrice: "优先显示折扣价",
    preferDiscountedPriceDesc:
      "目前仅 KIE 提供原价与折扣价两套价格参考。国内优惠价通常需要向 KIE 单独申请；启用后会优先按折扣价估算。",
    grsaiCreditTier: "GRSAI 积分套餐档位",
    grsaiCreditTierDesc: "GRSAI 采用积分扣费，不同充值档位对应的单次成本不同。",
    grsaiCreditTierOption: "¥{{price}} / {{credits}} 积分",
    checkUpdateNow: "立即检查更新",
    checkingUpdate: "正在检查更新...",
    checkUpdateHasUpdate: "检测到新版本。",
    checkUpdateUpToDate: "当前已是最新版本。",
    checkUpdateFailed: "检查更新失败，请稍后重试。",
    factoryReset: "工厂重置",
    factoryResetDesc:
      "清除所有本地数据（包括项目、设置和缓存图片）。此操作不可逆，请谨慎操作！",
    factoryResetButton: "清除所有数据并重置",
    factoryResetConfirmTitle: "确定要重置吗？",
    factoryResetConfirmDesc:
      "这将删除所有项目和配置，软件将恢复到初始安装状态。此操作无法撤销！",
    factoryResetSuccess: "重置成功，正在重启应用...",
  },
  Ct = {
    nativePrice: "原币种：{{value}}",
    originalPrice: "原价：{{value}}",
    pointsCost: "积分消耗：{{count}}",
    grsaiTier: "积分档位：¥{{price}} / {{credits}} 积分",
  },
  Pt = {
    dialogTitle: "发现新版本",
    dialogDescription: "检测到软件有新版本，是否前往下载？",
    goToQuarkDownload: "前往网盘下载",
    goToGithubDownload: "去 GitHub 下载",
    versionLine: "当前版本：{{currentVersion}}，最新版本：{{latestVersion}}",
    ignoreRule: "忽略提醒规则",
    ignoreTodayVersion: "今日不再提示该版本",
    ignoreThisVersionForever: "不再提示该版本",
    ignoreAllForever: "永远不再提示更新",
    applyIgnore: "应用忽略",
  },
  kt = { detailsTitle: "错误详情", copyReport: "复制报错信息" },
  Lt = {
    app: lt,
    common: ut,
    theme: dt,
    titleBar: ct,
    canvas: gt,
    tool: ht,
    toolDialog: ft,
    nodeToolbar: pt,
    modelParams: mt,
    node: yt,
    viewer: bt,
    split: xt,
    ai: St,
    project: wt,
    settings: vt,
    pricing: Ct,
    update: Pt,
    errorDialog: kt,
  },
  Dt = { title: "Storyboard Copilot", subtitle: "AI Storyboard Tool" },
  Ot = {
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    loading: "Loading...",
    error: "Error",
    success: "Success",
  },
  Rt = { dark: "Dark", light: "Light" },
  At = {
    back: "Back",
    switchToEnglish: "English",
    switchToChinese: "中文",
    minimize: "Minimize",
    maximize: "Maximize",
    close: "Close",
  },
  Tt = {
    addImage: "Add Image",
    splitStoryboard: "Split Storyboard",
    generate: "Generate",
    emptyHintTitle: "Double-click to add a node",
    emptyHintSubtitle: "Double-click to add a node",
    toolbar: {
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      fitView: "Fit View",
      lock: "Lock Canvas",
      unlock: "Unlock Canvas",
    },
  },
  It = { crop: "Crop", annotate: "Annotate", split: "Split" },
  Nt = {
    suffix: " Tool",
    noProcessableImage: "No processable image for current node",
    processFailed: "Processing failed",
    processing: "Processing...",
    apply: "Apply",
    cropResultTitle: "Crop Result",
    annotateResultTitle: "Annotation Result",
  },
  $t = {
    reupload: "Reupload",
    copy: "Copy",
    copyText: "Copy Text",
    copyErrorReport: "Copy Error",
    copied: "Copied",
    download: "Download",
    ungroup: "Ungroup",
    saveAs: "Save as...",
    noDownloadPresetPathsHint: "No preset path. Add one in Settings > General.",
    storyboardLine: "Storyboard {{index}}: {{content}}",
  },
  Et = {
    provider: "Provider",
    model: "Model",
    providerKeyRequiredTitle: "Provider API key required",
    providerKeyRequiredDesc:
      "{{provider}} is not configured yet. Please add its API key in Settings before using it.",
    goConfigure: "Go configure",
    autoAspectRatio: "Auto",
    quality: "Quality",
    aspectRatio: "Aspect Ratio",
    enableWebSearch: "Enable web search",
    otherParams: "Other Params",
    extraOptions: "Extra options",
    thinkingLevel: "Thinking level",
    thinkingLevelDesc:
      "Only applies to fal Nano Banana 2. High thinking adds extra cost.",
    thinkingDisabled: "Off",
    thinkingMinimal: "Standard",
    thinkingHigh: "High",
  },
  Ft = {
    menu: {
      uploadImage: "Upload Image",
      aiImageGeneration: "AI Image",
      storyboard: "Storyboard",
      textAnnotation: "Text Annotation",
      storyboardGen: "Storyboard Gen",
      vr360: "VR360",
      director3d: "3D Director",
    },
  },
  Ut = {
    imageAlt: "Image",
    prev: "Previous",
    next: "Next",
    reset: "Reset View",
  },
  jt = {
    title: "Split Storyboard",
    rows: "Rows",
    cols: "Columns",
    preview: "Preview",
    split: "Split",
  },
  Kt = {
    provider: "AI Provider",
    model: "Model",
    prompt: "Prompt",
    generating: "Generating...",
    success: "Generated successfully",
    error: "Generation failed",
  },
  Vt = {
    title: "Projects",
    newProject: "New Project",
    newProjectTitle: "New Project",
    open: "Open Project",
    save: "Save Project",
    name: "Project Name",
    namePlaceholder: "Enter project name",
    rename: "Rename",
    renameTitle: "Rename Project",
    delete: "Delete Project",
    created: "Created",
    modified: "Modified",
    updatedAt: "Updated",
    sortBy: "Sort by",
    sortDirection: "Sort order",
    sortByName: "Name",
    sortByCreatedAt: "Creation date",
    sortByUpdatedAt: "Modified date",
    sortAsc: "Ascending",
    sortDesc: "Descending",
    nodes: "Nodes",
    noProjects: "No Projects",
    empty: "No Projects",
    emptyHint: "Click the button above to create a new project",
  },
  Mt = {
    title: "Settings",
    providers: "API Key",
    providersDesc: "Configure AI provider API keys",
    pricing: "Pricing",
    pricingDesc:
      "Manage node price display, exchange rate conversion, and credit-pack estimates.",
    providerGuideText:
      "Different providers vary in model capability, queue speed, stability, and pricing. Switch providers based on your task, and follow each provider's recommended parameters.",
    doNotShowAgain: "Do not show again",
    appearance: "Appearance",
    appearanceDesc: "Customize app appearance",
    experimental: "Experimental",
    experimentalDesc: "Low-priority or experimental feature toggles.",
    about: "About",
    aboutDesc: "Application information",
    general: "General",
    generalDesc: "General settings",
    apiKey: "API Key",
    model: "Model",
    enterApiKey: "Enter API Key",
    nanoBananaProModel: "Nano Banana Pro Model",
    nanoBananaProModelDesc:
      "Switch the Nano Banana Pro endpoint for this provider. If one endpoint fails, try another one. See the <modelListLink>model list</modelListLink> for details.",
    addProvider: "Add Provider",
    providerPpioName: "PPIO",
    comingSoon: "Coming soon...",
    radiusPreset: "Corner Radius",
    radiusPresetDesc:
      "Control global corner style for panels, inputs, and nodes.",
    radiusCompact: "Compact",
    radiusDefault: "Default",
    radiusLarge: "Rounded",
    themeTone: "Theme Tone",
    themeToneDesc:
      "Choose neutral, warm, or cool tint for both light and dark themes.",
    toneNeutral: "Neutral",
    toneWarm: "Warm",
    toneCool: "Cool",
    edgeRoutingMode: "Edge Routing",
    edgeRoutingModeDesc:
      "Switch edge path style between nodes, including orthogonal routing with automatic node avoidance.",
    edgeRoutingSpline: "Spline",
    edgeRoutingOrthogonal: "Orthogonal",
    edgeRoutingSmartOrthogonal: "Smart Avoidance (Orthogonal)",
    accentColor: "Accent Color",
    accentColorDesc:
      "Used by buttons, selected borders, and interaction highlights.",
    resetAccentColor: "Reset",
    downloadPresetPaths: "Download Preset Paths",
    downloadPresetPathsDesc:
      "Used by node toolbar download menu for quick-save directories (up to 8).",
    storyboardGenKeepStyleConsistent:
      "Keep storyboard style aligned with references",
    storyboardGenKeepStyleConsistentDesc:
      'When enabled, storyboard generation prompt appends "图片风格与参考图保持一致".',
    storyboardGenDisableTextInImage:
      "Disallow descriptive text in storyboard image",
    storyboardGenDisableTextInImageDesc:
      'When enabled, storyboard generation prompt appends "禁止添加描述文本".',
    ignoreAtTagWhenCopyingAndGenerating:
      "Ignore @ tags when copying/saving text",
    ignoreAtTagWhenCopyingAndGeneratingDesc:
      'When enabled, copied text and embedded storyboard metadata remove tags like "@图1"; generation requests only remove "@" and keep "图1".',
    useUploadFilenameAsNodeTitle: "Use uploaded filename as node title",
    useUploadFilenameAsNodeTitleDesc:
      "When enabled, newly uploaded images use the file name as the node title by default (still editable via double-click).",
    downloadPathPlaceholder:
      "Input folder path, e.g. /Users/name/Pictures/Storyboard or D:\\\\Images\\\\Storyboard",
    addPath: "Add Path",
    chooseFolder: "Choose Folder",
    noDownloadPresetPaths: "No preset path yet",
    providerApiKeyGuidePrefix: "First",
    providerRegisterLink: "click here to sign up",
    providerApiKeyGuideMiddle: ", then",
    getApiKeyLink: "click here to get API key",
    missingAnyApiKeyMessage:
      "You have not configured any API keys yet. Please open Settings to configure one.",
    openProvidersSettings: "Open Settings",
    aboutAppName: "Storyboard Copilot",
    aboutIntro:
      "An AI storyboard workstation based on a node canvas for generation, editing, and storyboard workflows.",
    aboutVersionLabel: "Version",
    aboutVersionUnknown: "Unknown",
    aboutAuthorLabel: "Author",
    aboutAuthor: "痕继痕迹",
    aboutRepositoryLabel: "Repository",
    autoCheckUpdateOnLaunch: "Auto check updates on launch",
    autoCheckUpdateOnLaunchDesc:
      "Check for updates once every time the app starts.",
    enableUpdateDialog: "Enable update dialog",
    enableUpdateDialogDesc:
      "Show a custom dialog when a new version is detected.",
    enableStoryboardGenGridPreviewShortcut:
      "Enable storyboard grid preview shortcut",
    enableStoryboardGenGridPreviewShortcutDesc:
      "When enabled, holding Ctrl + Alt + Shift and clicking Generate on storyboard generation creates a grid preview node without sending AI request.",
    showStoryboardGenAdvancedRatioControls:
      "Show advanced storyboard ratio controls",
    showStoryboardGenAdvancedRatioControlsDesc:
      "When enabled, show cell/overall ratio info and the Overall/Cell mode switch. When disabled, storyboard generation uses cell-ratio mode by default.",
    storyboardGenAutoInferEmptyFrame: "Auto infer empty frames",
    storyboardGenAutoInferEmptyFrameDesc:
      'When enabled, empty storyboard cells automatically append "依据之前的内容进行推测" during generation prompt construction.',
    showNodePrice: "Show node price in the header",
    showNodePriceDesc:
      "Continuously estimate the current run cost from the selected model, resolution, and extra options.",
    priceDisplayCurrencyMode: "Display currency",
    priceDisplayCurrencyModeDesc:
      "In auto mode, Chinese uses CNY and English uses USD.",
    priceCurrencyAuto: "Follow language",
    priceCurrencyCny: "CNY",
    priceCurrencyUsd: "USD",
    usdToCnyRate: "USD to CNY rate",
    usdToCnyRateDesc:
      "Used only for price display conversion between USD and CNY. It does not change actual provider billing.",
    preferDiscountedPrice: "Prefer discounted price",
    preferDiscountedPriceDesc:
      "Currently this only applies to KIE. The discounted domestic pricing usually needs to be requested from KIE separately; when enabled, estimates prefer that discounted rate.",
    grsaiCreditTier: "GRSAI credit pack",
    grsaiCreditTierDesc:
      "GRSAI bills in credits, so the per-run estimate changes with your top-up pack.",
    grsaiCreditTierOption: "CNY {{price}} / {{credits}} credits",
    checkUpdateNow: "Check for updates now",
    checkingUpdate: "Checking for updates...",
    checkUpdateHasUpdate: "New version detected.",
    checkUpdateUpToDate: "You are on the latest version.",
    checkUpdateFailed: "Update check failed. Please try again later.",
    factoryReset: "Factory Reset",
    factoryResetDesc:
      "Clear all local data (projects, settings, and cached images). This is irreversible!",
    factoryResetButton: "Clear all data and reset",
    factoryResetConfirmTitle: "Confirm Factory Reset?",
    factoryResetConfirmDesc:
      "This will delete all your projects and configurations. The app will return to its initial state. This cannot be undone!",
    factoryResetSuccess: "Reset successful, restarting application...",
  },
  Gt = {
    nativePrice: "Native: {{value}}",
    originalPrice: "Original: {{value}}",
    pointsCost: "Credits: {{count}}",
    grsaiTier: "Pack: CNY {{price}} / {{credits}} credits",
  },
  Ht = {
    dialogTitle: "Update Available",
    dialogDescription:
      "A new version is available. Do you want to download it now?",
    goToQuarkDownload: "Quark Download",
    goToGithubDownload: "GitHub Releases",
    versionLine: "Current: {{currentVersion}}, Latest: {{latestVersion}}",
    ignoreRule: "Ignore reminder rule",
    ignoreTodayVersion: "Do not remind this version today",
    ignoreThisVersionForever: "Never remind this version",
    ignoreAllForever: "Never remind updates",
    applyIgnore: "Apply ignore",
  },
  Bt = { detailsTitle: "Error details", copyReport: "Copy error report" },
  zt = {
    app: Dt,
    common: Ot,
    theme: Rt,
    titleBar: At,
    canvas: Tt,
    tool: It,
    toolDialog: Nt,
    nodeToolbar: $t,
    modelParams: Et,
    node: Ft,
    viewer: Ut,
    split: jt,
    ai: Kt,
    project: Vt,
    settings: Mt,
    pricing: Gt,
    update: Ht,
    errorDialog: Bt,
  },
  Wt = { zh: { translation: Lt }, en: { translation: zt } };
x.use(ke)
  .use(Oe)
  .init({
    resources: Wt,
    fallbackLng: "zh",
    interpolation: { escapeValue: !1 },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });
export { x as default };
