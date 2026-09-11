var jt=Object.defineProperty;var Ut=(r,e,t)=>e in r?jt(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var v=(r,e,t)=>Ut(r,typeof e!="symbol"?e+"":e,t);/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ee=globalThis,Ke=ee.ShadowRoot&&(ee.ShadyCSS===void 0||ee.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ye=Symbol(),Je=new WeakMap;let xt=class{constructor(e,t,o){if(this._$cssResult$=!0,o!==Ye)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(Ke&&e===void 0){const o=t!==void 0&&t.length===1;o&&(e=Je.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&Je.set(t,e))}return e}toString(){return this.cssText}};const Dt=r=>new xt(typeof r=="string"?r:r+"",void 0,Ye),m=(r,...e)=>{const t=r.length===1?r[0]:e.reduce((o,i,a)=>o+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[a+1],r[0]);return new xt(t,r,Ye)},Vt=(r,e)=>{if(Ke)r.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const o=document.createElement("style"),i=ee.litNonce;i!==void 0&&o.setAttribute("nonce",i),o.textContent=t.cssText,r.appendChild(o)}},Qe=Ke?r=>r:r=>r instanceof CSSStyleSheet?(e=>{let t="";for(const o of e.cssRules)t+=o.cssText;return Dt(t)})(r):r;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Rt,defineProperty:qt,getOwnPropertyDescriptor:Ft,getOwnPropertyNames:Kt,getOwnPropertySymbols:Yt,getPrototypeOf:Xt}=Object,Z=globalThis,et=Z.trustedTypes,Wt=et?et.emptyScript:"",le=Z.reactiveElementPolyfillSupport,q=(r,e)=>r,be={toAttribute(r,e){switch(e){case Boolean:r=r?Wt:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,e){let t=r;switch(e){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},yt=(r,e)=>!Rt(r,e),tt={attribute:!0,type:String,converter:be,reflect:!1,useDefault:!1,hasChanged:yt};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),Z.litPropertyMetadata??(Z.litPropertyMetadata=new WeakMap);let N=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=tt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const o=Symbol(),i=this.getPropertyDescriptor(e,o,t);i!==void 0&&qt(this.prototype,e,i)}}static getPropertyDescriptor(e,t,o){const{get:i,set:a}=Ft(this.prototype,e)??{get(){return this[t]},set(n){this[t]=n}};return{get:i,set(n){const c=i==null?void 0:i.call(this);a==null||a.call(this,n),this.requestUpdate(e,c,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??tt}static _$Ei(){if(this.hasOwnProperty(q("elementProperties")))return;const e=Xt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(q("properties"))){const t=this.properties,o=[...Kt(t),...Yt(t)];for(const i of o)this.createProperty(i,t[i])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[o,i]of t)this.elementProperties.set(o,i)}this._$Eh=new Map;for(const[t,o]of this.elementProperties){const i=this._$Eu(t,o);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const o=new Set(e.flat(1/0).reverse());for(const i of o)t.unshift(Qe(i))}else e!==void 0&&t.push(Qe(e));return t}static _$Eu(e,t){const o=t.attribute;return o===!1?void 0:typeof o=="string"?o:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(t=>t(this))}addController(e){var t;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((t=e.hostConnected)==null||t.call(e))}removeController(e){var t;(t=this._$EO)==null||t.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const o of t.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Vt(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(t=>{var o;return(o=t.hostConnected)==null?void 0:o.call(t)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(t=>{var o;return(o=t.hostDisconnected)==null?void 0:o.call(t)})}attributeChangedCallback(e,t,o){this._$AK(e,o)}_$ET(e,t){var a;const o=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,o);if(i!==void 0&&o.reflect===!0){const n=(((a=o.converter)==null?void 0:a.toAttribute)!==void 0?o.converter:be).toAttribute(t,o.type);this._$Em=e,n==null?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(e,t){var a,n;const o=this.constructor,i=o._$Eh.get(e);if(i!==void 0&&this._$Em!==i){const c=o.getPropertyOptions(i),s=typeof c.converter=="function"?{fromAttribute:c.converter}:((a=c.converter)==null?void 0:a.fromAttribute)!==void 0?c.converter:be;this._$Em=i;const p=s.fromAttribute(t,c.type);this[i]=p??((n=this._$Ej)==null?void 0:n.get(i))??p,this._$Em=null}}requestUpdate(e,t,o,i=!1,a){var n;if(e!==void 0){const c=this.constructor;if(i===!1&&(a=this[e]),o??(o=c.getPropertyOptions(e)),!((o.hasChanged??yt)(a,t)||o.useDefault&&o.reflect&&a===((n=this._$Ej)==null?void 0:n.get(e))&&!this.hasAttribute(c._$Eu(e,o))))return;this.C(e,t,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:o,reflect:i,wrapped:a},n){o&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,n??t??this[e]),a!==!0||n!==void 0)||(this._$AL.has(e)||(this.hasUpdated||o||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var o;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[a,n]of this._$Ep)this[a]=n;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[a,n]of i){const{wrapped:c}=n,s=this[a];c!==!0||this._$AL.has(a)||s===void 0||this.C(a,void 0,n,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),(o=this._$EO)==null||o.forEach(i=>{var a;return(a=i.hostUpdate)==null?void 0:a.call(i)}),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){var t;(t=this._$EO)==null||t.forEach(o=>{var i;return(i=o.hostUpdated)==null?void 0:i.call(o)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}};N.elementStyles=[],N.shadowRootOptions={mode:"open"},N[q("elementProperties")]=new Map,N[q("finalized")]=new Map,le==null||le({ReactiveElement:N}),(Z.reactiveElementVersions??(Z.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const F=globalThis,rt=r=>r,ae=F.trustedTypes,ot=ae?ae.createPolicy("lit-html",{createHTML:r=>r}):void 0,wt="$lit$",S=`lit$${Math.random().toFixed(9).slice(2)}$`,kt="?"+S,Gt=`<${kt}>`,L=document,K=()=>L.createComment(""),Y=r=>r===null||typeof r!="object"&&typeof r!="function",Xe=Array.isArray,Jt=r=>Xe(r)||typeof(r==null?void 0:r[Symbol.iterator])=="function",de=`[ 	
\f\r]`,U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,it=/-->/g,at=/>/g,z=RegExp(`>|${de}(?:([^\\s"'>=/]+)(${de}*=${de}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),nt=/'/g,st=/"/g,$t=/^(?:script|style|textarea|title)$/i,Qt=r=>(e,...t)=>({_$litType$:r,strings:e,values:t}),d=Qt(1),A=Symbol.for("lit-noChange"),w=Symbol.for("lit-nothing"),ct=new WeakMap,H=L.createTreeWalker(L,129);function _t(r,e){if(!Xe(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return ot!==void 0?ot.createHTML(e):e}const er=(r,e)=>{const t=r.length-1,o=[];let i,a=e===2?"<svg>":e===3?"<math>":"",n=U;for(let c=0;c<t;c++){const s=r[c];let p,f,l=-1,g=0;for(;g<s.length&&(n.lastIndex=g,f=n.exec(s),f!==null);)g=n.lastIndex,n===U?f[1]==="!--"?n=it:f[1]!==void 0?n=at:f[2]!==void 0?($t.test(f[2])&&(i=RegExp("</"+f[2],"g")),n=z):f[3]!==void 0&&(n=z):n===z?f[0]===">"?(n=i??U,l=-1):f[1]===void 0?l=-2:(l=n.lastIndex-f[2].length,p=f[1],n=f[3]===void 0?z:f[3]==='"'?st:nt):n===st||n===nt?n=z:n===it||n===at?n=U:(n=z,i=void 0);const h=n===z&&r[c+1].startsWith("/>")?" ":"";a+=n===U?s+Gt:l>=0?(o.push(p),s.slice(0,l)+wt+s.slice(l)+S+h):s+S+(l===-2?c:h)}return[_t(r,a+(r[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),o]};class X{constructor({strings:e,_$litType$:t},o){let i;this.parts=[];let a=0,n=0;const c=e.length-1,s=this.parts,[p,f]=er(e,t);if(this.el=X.createElement(p,o),H.currentNode=this.el.content,t===2||t===3){const l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(i=H.nextNode())!==null&&s.length<c;){if(i.nodeType===1){if(i.hasAttributes())for(const l of i.getAttributeNames())if(l.endsWith(wt)){const g=f[n++],h=i.getAttribute(l).split(S),u=/([.?@])?(.*)/.exec(g);s.push({type:1,index:a,name:u[2],strings:h,ctor:u[1]==="."?rr:u[1]==="?"?or:u[1]==="@"?ir:se}),i.removeAttribute(l)}else l.startsWith(S)&&(s.push({type:6,index:a}),i.removeAttribute(l));if($t.test(i.tagName)){const l=i.textContent.split(S),g=l.length-1;if(g>0){i.textContent=ae?ae.emptyScript:"";for(let h=0;h<g;h++)i.append(l[h],K()),H.nextNode(),s.push({type:2,index:++a});i.append(l[g],K())}}}else if(i.nodeType===8)if(i.data===kt)s.push({type:2,index:a});else{let l=-1;for(;(l=i.data.indexOf(S,l+1))!==-1;)s.push({type:7,index:a}),l+=S.length-1}a++}}static createElement(e,t){const o=L.createElement("template");return o.innerHTML=e,o}}function O(r,e,t=r,o){var n,c;if(e===A)return e;let i=o!==void 0?(n=t._$Co)==null?void 0:n[o]:t._$Cl;const a=Y(e)?void 0:e._$litDirective$;return(i==null?void 0:i.constructor)!==a&&((c=i==null?void 0:i._$AO)==null||c.call(i,!1),a===void 0?i=void 0:(i=new a(r),i._$AT(r,t,o)),o!==void 0?(t._$Co??(t._$Co=[]))[o]=i:t._$Cl=i),i!==void 0&&(e=O(r,i._$AS(r,e.values),i,o)),e}class tr{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:o}=this._$AD,i=((e==null?void 0:e.creationScope)??L).importNode(t,!0);H.currentNode=i;let a=H.nextNode(),n=0,c=0,s=o[0];for(;s!==void 0;){if(n===s.index){let p;s.type===2?p=new j(a,a.nextSibling,this,e):s.type===1?p=new s.ctor(a,s.name,s.strings,this,e):s.type===6&&(p=new ar(a,this,e)),this._$AV.push(p),s=o[++c]}n!==(s==null?void 0:s.index)&&(a=H.nextNode(),n++)}return H.currentNode=L,i}p(e){let t=0;for(const o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(e,o,t),t+=o.strings.length-2):o._$AI(e[t])),t++}}class j{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,t,o,i){this.type=2,this._$AH=w,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=o,this.options=i,this._$Cv=(i==null?void 0:i.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=O(this,e,t),Y(e)?e===w||e==null||e===""?(this._$AH!==w&&this._$AR(),this._$AH=w):e!==this._$AH&&e!==A&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Jt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==w&&Y(this._$AH)?this._$AA.nextSibling.data=e:this.T(L.createTextNode(e)),this._$AH=e}$(e){var a;const{values:t,_$litType$:o}=e,i=typeof o=="number"?this._$AC(e):(o.el===void 0&&(o.el=X.createElement(_t(o.h,o.h[0]),this.options)),o);if(((a=this._$AH)==null?void 0:a._$AD)===i)this._$AH.p(t);else{const n=new tr(i,this),c=n.u(this.options);n.p(t),this.T(c),this._$AH=n}}_$AC(e){let t=ct.get(e.strings);return t===void 0&&ct.set(e.strings,t=new X(e)),t}k(e){Xe(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let o,i=0;for(const a of e)i===t.length?t.push(o=new j(this.O(K()),this.O(K()),this,this.options)):o=t[i],o._$AI(a),i++;i<t.length&&(this._$AR(o&&o._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){var o;for((o=this._$AP)==null?void 0:o.call(this,!1,!0,t);e!==this._$AB;){const i=rt(e).nextSibling;rt(e).remove(),e=i}}setConnected(e){var t;this._$AM===void 0&&(this._$Cv=e,(t=this._$AP)==null||t.call(this,e))}}class se{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,o,i,a){this.type=1,this._$AH=w,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=a,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=w}_$AI(e,t=this,o,i){const a=this.strings;let n=!1;if(a===void 0)e=O(this,e,t,0),n=!Y(e)||e!==this._$AH&&e!==A,n&&(this._$AH=e);else{const c=e;let s,p;for(e=a[0],s=0;s<a.length-1;s++)p=O(this,c[o+s],t,s),p===A&&(p=this._$AH[s]),n||(n=!Y(p)||p!==this._$AH[s]),p===w?e=w:e!==w&&(e+=(p??"")+a[s+1]),this._$AH[s]=p}n&&!i&&this.j(e)}j(e){e===w?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class rr extends se{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===w?void 0:e}}class or extends se{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==w)}}class ir extends se{constructor(e,t,o,i,a){super(e,t,o,i,a),this.type=5}_$AI(e,t=this){if((e=O(this,e,t,0)??w)===A)return;const o=this._$AH,i=e===w&&o!==w||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,a=e!==w&&(o===w||i);i&&this.element.removeEventListener(this.name,this,o),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t;typeof this._$AH=="function"?this._$AH.call(((t=this.options)==null?void 0:t.host)??this.element,e):this._$AH.handleEvent(e)}}class ar{constructor(e,t,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){O(this,e)}}const nr={I:j},he=F.litHtmlPolyfillSupport;he==null||he(X,j),(F.litHtmlVersions??(F.litHtmlVersions=[])).push("3.3.3");const sr=(r,e,t)=>{const o=(t==null?void 0:t.renderBefore)??e;let i=o._$litPart$;if(i===void 0){const a=(t==null?void 0:t.renderBefore)??null;o._$litPart$=i=new j(e.insertBefore(K(),a),a,void 0,t??{})}return i._$AI(r),i};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const P=globalThis;let b=class extends N{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=sr(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return A}};var mt;b._$litElement$=!0,b.finalized=!0,(mt=P.litElementHydrateSupport)==null||mt.call(P,{LitElement:b});const pe=P.litElementPolyfillSupport;pe==null||pe({LitElement:b});(P.litElementVersions??(P.litElementVersions=[])).push("4.2.2");/*!
 * CGo UI — 图标数据与 SVG 构建器（单一数据源）
 * 迁移自 cgoui/cgo_icons.js 的 ICONS 注册表。
 * <cgo-icon> 组件与 window.CGO.icon 兼容垫片共享本模块。
 *
 * 每个 key → { d, type?, viewBox? }
 *   d       : SVG 内部内容（path/circle/polygon… 字符串）
 *   type    : 'fill'(默认) | 'stroke'（fill:none stroke:currentColor）
 *   viewBox : 自定义视窗（默认 '0 0 24 24'）
 */const k={back:{d:'<path d="M14.62,19h-2.81c-.13,0-.25-.05-.34-.13l-7.41-6.72c-.09-.08-.09-.22,0-.3l7.41-6.72c.09-.08.21-.13.34-.13h2.81c.14,0,.2.17.1.26l-6.12,5.54h11.19c.11,0,.2.09.2.2v1.99c0,.11-.09.2-.2.2h-11.19l6.12,5.54c.1.09.04.26-.1.26Z"/>'},forward:{d:'<path d="M9.38,5h2.81c.13,0,.25.05.34.13l7.41,6.72c.09.08.09.22,0,.3l-7.41,6.72c-.09.08-.21.13-.34.13h-2.81c-.14,0-.2-.17-.1-.26l6.12-5.54H4.2c-.11,0-.2-.09-.2-.2v-1.99c0-.11.09-.2.2-.2h11.19l-6.12-5.54c-.1-.09-.04-.26.1-.26Z"/>'},home:{d:'<path d="M9.93,20.54v-5.79c0-.11.09-.21.21-.21h3.72c.11,0,.21.09.21.21v5.79c0,.11.09.21.21.21h4.75c.11,0,.21-.09.21-.21v-7.86c0-.11.09-.21.21-.21h2.35c.19,0,.28-.23.14-.36L12.14,3.3c-.08-.07-.2-.07-.28,0L2.07,12.12c-.14.13-.05.36.14.36h2.35c.11,0,.21.09.21.21v7.86c0,.11.09.21.21.21h4.75c.11,0,.21-.09.21-.21Z"/>'},"home-dots":{d:'<circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'},external:{d:'<path d="M5.3,17V7.7c0-.11-.09-.2-.2-.2h-1.9c-.11,0-.2.09-.2.2v9.5h0c0,1.27,1.03,2.3,2.3,2.3h12.5c.11,0,.2-.09.2-.2v-1.9c0-.11-.09-.2-.2-.2H5.5c-.11,0-.2-.09-.2-.2Z"/><path d="M7.3,13.38v1.62c0,.11.09.2.2.2h1.9c.11,0,.2-.09.2-.2v-1.77c0-1.27,1.03-2.3,2.3-2.3h4.85l-4.55,4.04c-.09.08-.03.23.09.23h2.61c.11,0,.21-.04.3-.11l5.74-5.1c.08-.07.08-.2,0-.27l-5.74-5.1c-.08-.07-.19-.11-.3-.11h-2.61c-.12,0-.18.15-.09.23l4.55,4.04h-4.85c-2.54,0-4.6,2.06-4.6,4.6Z"/>'},menu:{d:'<rect x="3" y="15.7" width="18" height="2.3" rx=".2" ry=".2"/><rect x="3" y="10.85" width="18" height="2.3" rx=".2" ry=".2"/><rect x="3" y="6" width="18" height="2.3" rx=".2" ry=".2"/>'},sun:{d:'<circle cx="12" cy="12" r="5"/><path d="M2,13h2c.55,0,1-.45,1-1s-.45-1-1-1h-2c-.55,0-1,.45-1,1s.45,1,1,1Z"/><path d="M20,13h2c.55,0,1-.45,1-1s-.45-1-1-1h-2c-.55,0-1,.45-1,1s.45,1,1,1Z"/><path d="M11,2v2c0,.55.45,1,1,1s1-.45,1-1v-2c0-.55-.45-1-1-1s-1,.45-1,1Z"/><path d="M11,20v2c0,.55.45,1,1,1s1-.45,1-1v-2c0-.55-.45-1-1-1s-1,.45-1,1Z"/><path d="M5.99,4.58c-.39-.39-1.03-.39-1.41,0-.39.39-.39,1.03,0,1.41l1.06,1.06c.39.39,1.03.39,1.41,0s.39-1.03,0-1.41l-1.06-1.06Z"/><path d="M18.36,16.95c-.39-.39-1.03-.39-1.41,0-.39.39-.39,1.03,0,1.41l1.06,1.06c.39.39,1.03.39,1.41,0,.39-.39.39-1.03,0-1.41l-1.06-1.06Z"/><path d="M19.42,5.99c.39-.39.39-1.03,0-1.41-.39-.39-1.03-.39-1.41,0l-1.06,1.06c-.39.39-.39,1.03,0,1.41s1.03.39,1.41,0l1.06-1.06Z"/><path d="M7.05,18.36c.39-.39.39-1.03,0-1.41-.39-.39-1.03-.39-1.41,0l-1.06,1.06c-.39.39-.39,1.03,0,1.41s1.03.39,1.41,0l1.06-1.06Z"/>'},moon:{d:'<path d="M14.86,14.44c-2.79-.2-5.1-2.51-5.29-5.3-.19-2.63,1.41-4.91,3.7-5.77.14-.05.12-.27-.03-.29-.92-.13-1.89-.11-2.89.07-3.72.68-6.68,3.73-7.24,7.47-.9,6.06,4.24,11.19,10.3,10.27,3.74-.56,6.77-3.53,7.45-7.25.18-.99.19-1.95.06-2.88-.02-.15-.23-.17-.29-.03-.86,2.29-3.14,3.89-5.77,3.7Z"/>'},add:{d:'<path d="M19.3,10.8h-6.1v-6.1c0-.11-.09-.2-.2-.2h-2c-.11,0-.2.09-.2.2v6.1h-6.1c-.11,0-.2.09-.2.2v2c0,.11.09.2.2.2h6.1v6.1c0,.11.09.2.2.2h2c.11,0,.2-.09.2-.2v-6.1h6.1c.11,0,.2-.09.2-.2v-2c0-.11-.09-.2-.2-.2Z"/>'},addone:{d:'<circle cx="12" cy="12" r="4"/><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM12,19.33c-4.05,0-7.33-3.28-7.33-7.33s3.28-7.33,7.33-7.33,7.33,3.28,7.33,7.33-3.28,7.33-7.33,7.33Z"/>'},edit:{d:'<path d="M20.71,5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41,0l-1.69,1.69c-.08.08-.08.2,0,.28l3.47,3.47c.08.08.2.08.28,0l1.69-1.69c.39-.39.39-1.02,0-1.41Z"/><path d="M3,17.33v3.47c0,.11.09.2.2.2h3.47c.05,0,.1-.02.14-.06l10.86-10.86c.08-.08.08-.2,0-.28l-3.47-3.47c-.08-.08-.2-.08-.28,0L3.06,17.19s-.06.09-.06.14Z"/>'},delete:{d:'<path d="M6,19c0,1.1.9,2,2,2h8c1.1,0,2-.9,2-2V7.2c0-.11-.09-.2-.2-.2H6.2c-.11,0-.2.09-.2.2v11.8Z"/><path d="M18.8,4h-3.22c-.05,0-.1-.02-.14-.06l-.88-.88s-.09-.06-.14-.06h-4.83c-.05,0-.1.02-.14.06l-.88.88s-.09.06-.14.06h-3.22c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2h13.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2Z"/>'},save:{d:'<path d="M20.85,6.85l-3.71-3.71c-.09-.09-.22-.15-.35-.15H5c-1.11,0-2,.9-2,2v14c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V7.21c0-.13-.05-.26-.15-.35ZM12,19c-1.66,0-3-1.34-3-3s1.34-3,3-3,3,1.34,3,3-1.34,3-3,3ZM15,8.8c0,.11-.09.2-.2.2H5.2c-.11,0-.2-.09-.2-.2v-3.6c0-.11.09-.2.2-.2h9.6c.11,0,.2.09.2.2v3.6Z"/>'},copy:{d:'<path d="M20.5,2h-12c-.83,0-1.5.67-1.5,1.5v1.5h8.5c1.93,0,3.5,1.57,3.5,3.5v8.5h1.5c.83,0,1.5-.67,1.5-1.5V3.5c0-.83-.67-1.5-1.5-1.5Z"/><path d="M15.5,7H3.5c-.83,0-1.5.67-1.5,1.5v12c0,.83.67,1.5,1.5,1.5h12c.83,0,1.5-.67,1.5-1.5v-12c0-.83-.67-1.5-1.5-1.5ZM14.5,15.3c0,.11-.09.2-.2.2h-3.8v3.8c0,.11-.09.2-.2.2h-1.6c-.11,0-.2-.09-.2-.2v-3.8h-3.8c-.11,0-.2-.09-.2-.2v-1.6c0-.11.09-.2.2-.2h3.8v-3.8c0-.11.09-.2.2-.2h1.6c.11,0,.2.09.2.2v3.8h3.8c.11,0,.2.09.2.2v1.6Z"/>'},close:{d:'<path d="M13.7,12l4.99-4.99c.08-.08.08-.2,0-.28l-1.41-1.41c-.08-.08-.2-.08-.28,0l-4.99,4.99-4.99-4.99c-.08-.08-.2-.08-.28,0l-1.41,1.41c-.08.08-.08.2,0,.28l4.99,4.99-4.99,4.99c-.08.08-.08.2,0,.28l1.41,1.41c.08.08.2.08.28,0l4.99-4.99,4.99,4.99c.08.08.2.08.28,0l1.41-1.41c.08-.08.08-.2,0-.28l-4.99-4.99Z"/>'},refresh:{d:'<path d="M20.99,4.89c0-.13-.06-.24-.14-.33l-2.06-2.02c-.1-.09-.26-.02-.25.12l.49,6.74-1.94-1.92-.57-.57c-1.47-1.33-3.42-2.15-5.56-2.17h-.08c-3.58,0-6.87,2.23-7.95,5.65-1.84,5.79,2.43,11.11,7.95,11.11,3.63,0,6.73-2.32,7.88-5.55.05-.13-.05-.26-.18-.27l-2.09-.12c-.08,0-.15.04-.19.11-1.05,2.25-3.45,3.73-6.17,3.41s-4.91-2.54-5.22-5.25c-.42-3.64,2.42-6.71,5.96-6.71,1.66,0,3.16.67,4.24,1.76l2.21,2.19-.84-.06-6.01-.42c-.14-.01-.21.15-.12.25l2.06,2.02c.09.08.2.14.32.14l4.13.24,2.38.14,2.04.12c.12.01.22-.09.21-.21l-.51-8.4Z"/>'},undo:{d:'<path d="M7.17,15.07l5.17-5.1c1.22-1.2,3.19-1.2,4.4,0l2.5,2.46c.09.09.23.09.32,0l1.38-1.36c.09-.09.09-.23,0-.31l-2.5-2.46c-1.65-1.63-4.1-2.01-6.11-1.13-.61.26-1.18.64-1.68,1.13l-5.17,5.1.49-6.71c.01-.15-.18-.24-.29-.13l-2.01,1.98c-.1.1-.15.22-.16.36l-.5,8.38c0,.13.1.24.24.23l8.5-.49c.14,0,.27-.07.36-.16l2.01-1.98c.11-.11.02-.29-.13-.28l-6.81.48Z"/>'},redo:{d:'<path d="M16.83,15.07l-5.17-5.1c-1.22-1.2-3.19-1.2-4.4,0l-2.5,2.46c-.09.09-.23.09-.32,0l-1.38-1.36c-.09-.09-.09-.23,0-.31l2.5-2.46c1.65-1.63,4.1-2.01,6.11-1.13.61.26,1.18.64,1.68,1.13l5.17,5.1-.49-6.71c-.01-.15.18-.24.29-.13l2.01,1.98c.1.1.15.22.16.36l.5,8.38c0,.13-.1.24-.24.23l-8.5-.49c-.14,0-.27-.07-.36-.16l-2.01-1.98c-.11-.11-.02-.29.13-.28l6.81.48Z"/>'},file:{d:'<path d="M19.85,7.85l-5.71-5.71c-.09-.09-.22-.15-.35-.15h-7.79c-1.1,0-1.99.9-1.99,2v16c-.01,1.1.88,2,1.98,2h12.01c1.1,0,2-.9,2-2v-11.79c0-.13-.05-.26-.15-.35ZM16,17.8c0,.11-.09.2-.2.2h-7.6c-.11,0-.2-.09-.2-.2v-1.6c0-.11.09-.2.2-.2h7.6c.11,0,.2.09.2.2v1.6ZM16,13.8c0,.11-.09.2-.2.2h-7.6c-.11,0-.2-.09-.2-.2v-1.6c0-.11.09-.2.2-.2h7.6c.11,0,.2.09.2.2v1.6ZM18.02,9h-4.82c-.11,0-.2-.09-.2-.2V3.98c0-.18.22-.27.34-.14l4.82,4.82c.13.13.04.34-.14.34Z"/>'},folder:{d:'<path d="M10.15,4.15c-.09-.09-.22-.15-.35-.15h-5.79c-1.1,0-1.99.9-1.99,2v12c0,1.1.89,2,1.99,2h16c1.1,0,2-.9,2-2v-10c0-1.1-.9-2-2-2h-7.79c-.13,0-.26-.05-.35-.15l-1.71-1.71Z"/>'},upload:{d:'<rect x="6" y="18.1" width="12" height="2.4" rx=".2" ry=".2"/><path d="M6,13.27v-2.93c0-.12.04-.24.13-.33l5.72-6.44c.08-.09.22-.09.3,0l5.72,6.44c.08.09.13.21.13.33v2.93c0,.14-.17.2-.26.1l-4.53-5.1v9.05c0,.11-.09.2-.2.2h-2.01c-.11,0-.2-.09-.2-.2v-9.05l-4.53,5.1c-.09.1-.26.04-.26-.1Z"/>'},download:{d:'<rect x="6" y="18.1" width="12" height="2.4" rx=".2" ry=".2"/><path d="M18,7.74v2.93c0,.12-.04.24-.13.33l-5.72,6.44c-.08.09-.22.09-.3,0l-5.72-6.44c-.08-.09-.13-.21-.13-.33v-2.93c0-.14.17-.2.26-.1l4.53,5.1V3.7c0-.11.09-.2.2-.2h2.01c.11,0,.2.09.2.2v9.05l4.53-5.1c.09-.1.26-.04.26.1Z"/>'},"export-img":{d:'<path d="M19,3H5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM18.59,18.79H5.41c-.11,0-.2-.09-.2-.2V5.41c0-.11.09-.2.2-.2h13.18c.11,0,.2.09.2.2v10.16l-3.03-4.59c-.08-.12-.25-.12-.33,0l-3.03,4.45c-.08.11-.25.12-.33,0l-2.07-2.83c-.08-.11-.25-.11-.33,0l-2.96,4.33c-.1.14,0,.35.15.35h11.92v1.31c0,.11-.09.2-.2.2Z"/><circle cx="8.22" cy="8.48" r="1.54"/>'},"export-svg":{d:'<path d="M20.71,5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41,0l-1.69,1.69c-.08.08-.08.2,0,.28l3.47,3.47c.08.08.2.08.28,0l1.69-1.69c.39-.39.39-1.02,0-1.41Z"/><path d="M3,17.33v3.47c0,.11.09.2.2.2h3.47c.05,0,.1-.02.14-.06l10.86-10.86c.08-.08.08-.2,0-.28l-3.47-3.47c-.08-.08-.2-.08-.28,0L3.06,17.19s-.06.09-.06.14Z"/>'},"export-json":{d:'<path d="M9.87,17.5h-2.32c-.1,0-.2-.04-.28-.12l-5.21-5.24c-.07-.07-.07-.19,0-.27l5.21-5.25c.08-.08.18-.12.28-.12h2.33c.11,0,.17.16.08.24l-5.18,5.19s-.04.1,0,.14l5.17,5.19c.08.08.03.24-.08.24Z"/><path d="M14.13,6.5h2.32c.1,0,.2.04.28.12l5.21,5.24c.07.07.07.19,0,.27l-5.21,5.25c-.08.08-.18.12-.28.12h-2.33c-.11,0-.17-.16-.08-.24l5.18-5.19s.04-.1,0-.14l-5.17-5.19c-.08-.08-.03-.24.08-.24Z"/>'},"export-zip":{d:'<rect x="6.62" y="15.82" width="2.74" height="1.37" rx=".2" ry=".2"/><path d="M19.85,7.85l-5.71-5.71c-.09-.09-.22-.15-.35-.15h-7.79c-1.1,0-1.99.9-1.99,2v16c-.01,1.1.88,2,1.98,2h12.01c1.1,0,2-.9,2-2v-11.79c0-.13-.05-.26-.15-.35ZM5.94,5.07c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97ZM5.94,7.81c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97ZM5.94,10.54c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97ZM10.04,12.88s0,0,0,0v4.98c0,.38-.3.69-.68.69h-2.74c-.38,0-.68-.31-.68-.69v-4.59c0-.11.09-.2.2-.2h1.85v-1.17c0-.11.09-.2.2-.2h1.04s0,0,0,0h.61c.11,0,.2.09.2.2v.97ZM10.04,10.14c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97ZM10.04,7.41c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97ZM10.04,4.67c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97Z"/>'},"export-pdf":{d:'<path d="M7.38,13.14h-.54v1.73h.58c.65,0,.76-.33.76-.92s-.16-.81-.8-.81Z"/><path d="M11.59,13.15h-.18v3.69h.18c.9,0,1.33-.44,1.33-1.87s-.43-1.82-1.33-1.82Z"/><path d="M14,2H6c-1.1,0-1.99.9-1.99,2v16c-.01,1.1.88,2,1.98,2h12.01c1.1,0,2-.9,2-2v-12l-6-6ZM7.49,16.01h-.65v1.99h-1.34v-5.8c0-.11.09-.2.2-.2h1.76c1.22,0,2.02.48,2.02,1.96s-.82,2.05-1.99,2.05ZM11.74,18h-1.47c-.11,0-.2-.09-.2-.2v-5.6c0-.11.09-.2.2-.2h1.4c1.69,0,2.61.89,2.61,2.97s-.92,3.03-2.54,3.03ZM18.5,13.2h-2.21v1.31h1.9v1.2h-1.9v2.29h-1.34v-5.8c0-.11.09-.2.2-.2h3.35v1.2ZM13,9V3.5l5.5,5.5h-5.5Z"/>'},search:{d:'<path d="M20.6,19.11l-4.85-4.86h-.79l-.28-.27c1.2-1.4,1.82-3.31,1.48-5.34-.47-2.78-2.79-5-5.59-5.34-4.23-.52-7.79,3.04-7.27,7.27.34,2.8,2.56,5.12,5.34,5.59,2.03.34,3.94-.28,5.34-1.48l.27.28v.79l4.86,4.85c.08.08.2.08.28,0l1.21-1.21c.08-.08.08-.2,0-.28ZM9.76,14.26c-2.49,0-4.5-2.01-4.5-4.5s2.01-4.5,4.5-4.5,4.5,2.01,4.5,4.5-2.01,4.5-4.5,4.5Z"/>'},filter:{d:'<path d="M4.25,5.61c2.02,2.59,5.75,7.39,5.75,7.39v6c0,.55.45,1,1,1h2c.55,0,1-.45,1-1v-6s3.72-4.8,5.74-7.39c.34-.44.26-1.07-.18-1.4-.17-.13-.39-.21-.61-.21H5.04c-.55,0-1,.45-1,1,0,.22.07.43.21.61Z"/>'},sort:{d:'<rect x="3" y="15.7" width="6" height="2.3" rx=".2" ry=".2"/><rect x="3" y="10.85" width="12" height="2.3" rx=".2" ry=".2"/><rect x="3" y="6" width="18" height="2.3" rx=".2" ry=".2"/>'},"view-list":{d:'<rect x="3.5" y="6" width="2.5" height="2.5" rx="1.25" ry="1.25"/><path d="M8,6.2v2.1c0,.11.08.2.18.2h11.13c.1,0,.18-.09.18-.2v-2.1c0-.11-.08-.2-.18-.2h-11.13c-.1,0-.18.09-.18.2Z"/><rect x="3.5" y="15.5" width="2.5" height="2.5" rx="1.25" ry="1.25"/><path d="M8,15.7v2.1c0,.11.08.2.18.2h11.13c.1,0,.18-.09.18-.2v-2.1c0-.11-.08-.2-.18-.2h-11.13c-.1,0-.18.09-.18.2Z"/><rect x="3.5" y="10.75" width="2.5" height="2.5" rx="1.25" ry="1.25"/><path d="M8,10.95v2.1c0,.11.08.2.18.2h11.13c.1,0,.18-.09.18-.2v-2.1c0-.11-.08-.2-.18-.2h-11.13c-.1,0-.18.09-.18.2Z"/>'},"view-grid":{d:'<rect x="3" y="3" width="8" height="8" rx="3" ry="3"/><rect x="13" y="3" width="8" height="8" rx="3" ry="3"/><rect x="3" y="13" width="8" height="8" rx="3" ry="3"/><rect x="13" y="13" width="8" height="8" rx="3" ry="3"/>'},"arrow-left":{d:'<path d="M14.62,19h-2.81c-.13,0-.25-.05-.34-.13l-7.41-6.72c-.09-.08-.09-.22,0-.3l7.41-6.72c.09-.08.21-.13.34-.13h2.81c.14,0,.2.17.1.26l-6.12,5.54h11.19c.11,0,.2.09.2.2v1.99c0,.11-.09.2-.2.2h-11.19l6.12,5.54c.1.09.04.26-.1.26Z"/>'},"arrow-right":{d:'<path d="M9.38,5h2.81c.13,0,.25.05.34.13l7.41,6.72c.09.08.09.22,0,.3l-7.41,6.72c-.09.08-.21.13-.34.13h-2.81c-.14,0-.2-.17-.1-.26l6.12-5.54H4.2c-.11,0-.2-.09-.2-.2v-1.99c0-.11.09-.2.2-.2h11.19l-6.12-5.54c-.1-.09-.04-.26.1-.26Z"/>'},"arrow-up":{d:'<path d="M5,14.62v-2.81c0-.13.05-.25.13-.34l6.72-7.41c.08-.09.22-.09.3,0l6.72,7.41c.08.09.13.21.13.34v2.81c0,.14-.17.2-.26.1l-5.54-6.12v11.19c0,.11-.09.2-.2.2h-1.99c-.11,0-.2-.09-.2-.2v-11.19l-5.54,6.12c-.09.1-.26.04-.26-.1Z"/>'},"arrow-down":{d:'<path d="M19,9.38v2.81c0,.13-.05.25-.13.34l-6.72,7.41c-.08.09-.22.09-.3,0l-6.72-7.41c-.08-.09-.13-.21-.13-.34v-2.81c0-.14.17-.2.26-.1l5.54,6.12V4.2c0-.11.09-.2.2-.2h1.99c.11,0,.2.09.2.2v11.19l5.54-6.12c.09-.1.26-.04.26.1Z"/>'},"chevron-left":{d:'<path d="M16.68,18h-2.81c-.12,0-.24-.05-.34-.13l-6.31-5.72c-.09-.08-.09-.21,0-.29l6.31-5.73c.09-.08.21-.13.34-.13h2.82c.14,0,.2.17.1.26l-6.27,5.66s-.04.11,0,.15l6.26,5.66c.1.09.04.26-.1.26Z"/>'},"chevron-right":{d:'<path d="M7.32,6h2.81c.12,0,.24.05.34.13l6.31,5.72c.09.08.09.21,0,.29l-6.31,5.73c-.09.08-.21.13-.34.13h-2.82c-.14,0-.2-.17-.1-.26l6.27-5.66s.04-.11,0-.15l-6.26-5.66c-.1-.09-.04-.26.1-.26Z"/>'},"chevron-up":{d:'<path d="M6,16.68v-2.81c0-.12.05-.24.13-.34l5.72-6.31c.08-.09.21-.09.29,0l5.73,6.31c.08.09.13.21.13.34v2.82c0,.14-.17.2-.26.1l-5.66-6.27s-.11-.04-.15,0l-5.66,6.26c-.09.1-.26.04-.26-.1Z"/>'},"chevron-down":{d:'<path d="M18,7.32v2.81c0,.12-.05.24-.13.34l-5.72,6.31c-.08.09-.21.09-.29,0l-5.73-6.31c-.08-.09-.13-.21-.13-.34v-2.82c0-.14.17-.2.26-.1l5.66,6.27s.11.04.15,0l5.66-6.26c.09-.1.26-.04.26.1Z"/>'},"expand-more":{d:'<path d="M18,7.32v2.81c0,.12-.05.24-.13.34l-5.72,6.31c-.08.09-.21.09-.29,0l-5.73-6.31c-.08-.09-.13-.21-.13-.34v-2.82c0-.14.17-.2.26-.1l5.66,6.27s.11.04.15,0l5.66-6.26c.09-.1.26-.04.26.1Z"/>'},"expand-less":{d:'<path d="M6,16.68v-2.81c0-.12.05-.24.13-.34l5.72-6.31c.08-.09.21-.09.29,0l5.73,6.31c.08.09.13.21.13.34v2.82c0,.14-.17.2-.26.1l-5.66-6.27s-.11-.04-.15,0l-5.66,6.26c-.09.1-.26.04-.26-.1Z"/>'},unfold:{d:'<path d="M6.5,9.87v-2.32c0-.1.04-.2.12-.28l5.24-5.21c.07-.07.19-.07.27,0l5.25,5.21c.08.08.12.18.12.28v2.33c0,.11-.16.17-.24.08l-5.19-5.18s-.1-.04-.14,0l-5.19,5.17c-.08.08-.24.03-.24-.08Z"/><path d="M17.5,14.13v2.32c0,.1-.04.2-.12.28l-5.24,5.21c-.07.07-.19.07-.27,0l-5.25-5.21c-.08-.08-.12-.18-.12-.28v-2.33c0-.11.16-.17.24-.08l5.19,5.18s.1.04.14,0l5.19-5.17c.08-.08.24-.03.24.08Z"/>'},"flip-h":{d:'<path d="M8.14,6v12.01c0,.17-.17.28-.32.2l-4.69-2.29c-.08-.04-.13-.12-.13-.2v-7.43c0-.09.05-.16.13-.2l4.69-2.29c.15-.07.32.04.32.2Z"/><path d="M15.86,6v12.01c0,.17.17.28.32.2l4.69-2.29c.08-.04.13-.12.13-.2v-7.43c0-.09-.05-.16-.13-.2l-4.69-2.29c-.15-.07-.32.04-.32.2Z"/><rect x="10.88" y="3" width="2.25" height="18" rx=".2" ry=".2"/>'},"flip-v":{d:'<path d="M6,15.86h12.01c.17,0,.28.17.2.32l-2.29,4.69c-.04.08-.12.13-.2.13h-7.43c-.09,0-.16-.05-.2-.13l-2.29-4.69c-.07-.15.04-.32.2-.32Z"/><path d="M6,8.14h12.01c.17,0,.28-.17.2-.32l-2.29-4.69c-.04-.08-.12-.13-.2-.13h-7.43c-.09,0-.16.05-.2.13l-2.29,4.69c-.07.15.04.32.2.32Z"/><rect x="10.88" y="3" width="2.25" height="18" rx=".2" ry=".2" transform="translate(0 24) rotate(-90)"/>'},check:{d:'<path d="M19.09,5.26l-10.09,10.09-4.09-4.09c-.08-.08-.2-.08-.28,0l-1.48,1.48c-.08.08-.08.2,0,.28l4.09,4.09,1.62,1.62c.08.08.2.08.28,0l1.62-1.62,10.09-10.09c.08-.08.08-.2,0-.28l-1.48-1.48c-.08-.08-.2-.08-.28,0Z"/>'},"check-circle":{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM17.86,8.85l-7.72,7.72c-.08.08-.2.08-.28,0l-3.72-3.72c-.08-.08-.08-.2,0-.28l1.13-1.13c.08-.08.2-.08.28,0l2.45,2.44,6.45-6.45c.08-.08.21-.08.28,0l1.13,1.14c.08.08.08.2,0,.28Z"/>'},warning:{d:'<path d="M22.72,21.2L12.17,2.6c-.08-.13-.27-.13-.34,0L1.28,21.2c-.08.13.02.3.17.3h21.1c.15,0,.25-.17.17-.3ZM13.1,19.22c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-1.8c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v1.8ZM13.1,14.82c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-6.2c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v6.2Z"/>'},error:{d:'<path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2ZM16.86,15.45c.08.08.08.2,0,.28l-1.13,1.13c-.08.08-.2.08-.28,0l-3.45-3.45-3.45,3.45c-.08.08-.2.08-.28,0l-1.13-1.13c-.08-.08-.08-.2,0-.28l3.45-3.45-3.45-3.45c-.08-.08-.08-.2,0-.28l1.13-1.13c.08-.08.2-.08.28,0l3.45,3.45,3.45-3.45c.08-.08.2-.08.28,0l1.13,1.13c.08.08.08.2,0,.28l-3.45,3.45,3.45,3.45Z"/>'},"error-outline":{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM13.1,17.3c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-1.8c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v1.8ZM13.1,12.9c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-6.2c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v6.2Z"/>'},info:{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM13.1,17.3c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-6.2c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v6.2ZM13.1,8.5c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-1.8c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v1.8Z"/>'},help:{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM12.94,18.13c0,.34-.28.62-.63.62h-.79c-.35,0-.63-.28-.63-.62v-1.11c0-.34.28-.62.63-.62h.79c.35,0,.63.28.63.62v1.11ZM15.82,10.71c-.28.51-.89,1.19-1.83,2.07-.48.45-.78.81-.9,1.09-.08.19-.13.49-.15.89-.02.33-.29.58-.62.58h-.85c-.34,0-.62-.27-.62-.61,0-.76.11-1.38.33-1.87.22-.49.67-1.04,1.34-1.65.67-.61,1.07-1.01,1.2-1.2.3-.44.37-.95.23-1.52-.01-.04-.03-.09-.05-.13-.35-.77-.97-1.16-1.86-1.16-.58,0-1.07.19-1.46.56-.3.28-.52.67-.68,1.18-.09.3-.38.49-.69.44l-.94-.13c-.34-.05-.59-.37-.53-.7.16-.83.55-1.55,1.17-2.16.77-.76,1.78-1.14,3.02-1.14,1.31,0,2.36.39,3.13,1.16.78.77,1.16,1.67,1.16,2.69,0,.57-.14,1.1-.43,1.61Z"/>'},notification:{d:'<path d="M12,21.75c1.03,0,1.88-.78,1.99-1.78.01-.12-.09-.22-.21-.22h-3.57c-.12,0-.22.1-.21.22.11,1,.96,1.78,1.99,1.78Z"/><path d="M18.06,15.81s-.06-.09-.06-.14v-4.92c0-3.07-1.64-5.64-4.5-6.32v-.68c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5,1.5v.68c-2.87.68-4.5,3.24-4.5,6.32v4.92c0,.05-.02.1-.06.14l-1.94,1.94v1h16v-1l-1.94-1.94Z"/>'},settings:{d:'<path d="M19.43,12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49,1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65c-.03-.24-.24-.42-.49-.42h-4c-.25,0-.46.18-.49.42l-.38,2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49,0-.61.22l-2,3.46c-.13.22-.07.49.12.64l2.11,1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11,1.65c-.19.15-.24.42-.12.64l2,3.46c.12.22.39.3.61.22l2.49-1c.52.4,1.08.73,1.69.98l.38,2.65c.03.24.24.42.49.42h4c.25,0,.46-.18.49-.42l.38-2.65c.61-.25,1.17-.59,1.69-.98l2.49,1c.23.09.49,0,.61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65ZM12,15.5c-1.93,0-3.5-1.57-3.5-3.5s1.57-3.5,3.5-3.5,3.5,1.57,3.5,3.5-1.57,3.5-3.5,3.5Z"/>'},"more-vert":{d:'<circle cx="12" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18" r="2"/>'},"more-horiz":{d:'<circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="12" cy="12" r="2"/>'},drag:{d:'<circle cx="9" cy="18" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>'},pin:{d:'<path d="M16.06,12.06s-.06-.09-.06-.14v-7.92h1v-1.8c0-.11-.09-.2-.2-.2H7.2c-.11,0-.2.09-.2.2v1.8h1v7.92c0,.05-.02.1-.06.14l-1.88,1.88s-.06.09-.06.14v1.72c0,.11.09.2.2.2h4.8c.11,0,.2.09.2.2v5c0,.44.36.8.8.8h0c.44,0,.8-.36.8-.8v-5c0-.11.09-.2.2-.2h4.8c.11,0,.2-.09.2-.2v-1.72c0-.05-.02-.1-.06-.14l-1.88-1.88Z"/>'},fullscn:{d:'<path d="M6.8,14h-1.6c-.11,0-.2.09-.2.2v4.6c0,.11.09.2.2.2h4.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2h-2.6c-.11,0-.2-.09-.2-.2v-2.6c0-.11-.09-.2-.2-.2Z"/><path d="M5.2,10h1.6c.11,0,.2-.09.2-.2v-2.6c0-.11.09-.2.2-.2h2.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2h-4.6c-.11,0-.2.09-.2.2v4.6c0,.11.09.2.2.2Z"/><path d="M16.8,17h-2.6c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2h4.6c.11,0,.2-.09.2-.2v-4.6c0-.11-.09-.2-.2-.2h-1.6c-.11,0-.2.09-.2.2v2.6c0,.11-.09.2-.2.2Z"/><path d="M14,5.2v1.6c0,.11.09.2.2.2h2.6c.11,0,.2.09.2.2v2.6c0,.11.09.2.2.2h1.6c.11,0,.2-.09.2-.2v-4.6c0-.11-.09-.2-.2-.2h-4.6c-.11,0-.2.09-.2.2Z"/>'},"fullscn-exit":{d:'<path d="M5.2,16h2.6c.11,0,.2.09.2.2v2.6c0,.11.09.2.2.2h1.6c.11,0,.2-.09.2-.2v-4.6c0-.11-.09-.2-.2-.2h-4.6c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2Z"/><path d="M7.8,8h-2.6c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2h4.6c.11,0,.2-.09.2-.2v-4.6c0-.11-.09-.2-.2-.2h-1.6c-.11,0-.2.09-.2.2v2.6c0,.11-.09.2-.2.2Z"/><path d="M14.2,19h1.6c.11,0,.2-.09.2-.2v-2.6c0-.11.09-.2.2-.2h2.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2h-4.6c-.11,0-.2.09-.2.2v4.6c0,.11.09.2.2.2Z"/><path d="M16,7.8v-2.6c0-.11-.09-.2-.2-.2h-1.6c-.11,0-.2.09-.2.2v4.6c0,.11.09.2.2.2h4.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2h-2.6c-.11,0-.2-.09-.2-.2Z"/>'},"zoom-in":{d:'<path d="M19.3,10.8h-6.1v-6.1c0-.11-.09-.2-.2-.2h-2c-.11,0-.2.09-.2.2v6.1h-6.1c-.11,0-.2.09-.2.2v2c0,.11.09.2.2.2h6.1v6.1c0,.11.09.2.2.2h2c.11,0,.2-.09.2-.2v-6.1h6.1c.11,0,.2-.09.2-.2v-2c0-.11-.09-.2-.2-.2Z"/>'},"zoom-out":{d:'<rect x="10.8" y="4.5" width="2.4" height="15" rx=".2" ry=".2" transform="translate(24) rotate(90)"/>'},"zoom-reset":{d:'<path d="M20.99,4.89c0-.13-.06-.24-.14-.33l-2.06-2.02c-.1-.09-.26-.02-.25.12l.49,6.74-1.94-1.92-.57-.57c-1.47-1.33-3.42-2.15-5.56-2.17h-.08c-3.58,0-6.87,2.23-7.95,5.65-1.84,5.79,2.43,11.11,7.95,11.11,3.63,0,6.73-2.32,7.88-5.55.05-.13-.05-.26-.18-.27l-2.09-.12c-.08,0-.15.04-.19.11-1.05,2.25-3.45,3.73-6.17,3.41s-4.91-2.54-5.22-5.25c-.42-3.64,2.42-6.71,5.96-6.71,1.66,0,3.16.67,4.24,1.76l2.21,2.19-.84-.06-6.01-.42c-.14-.01-.21.15-.12.25l2.06,2.02c.09.08.2.14.32.14l4.13.24,2.38.14,2.04.12c.12.01.22-.09.21-.21l-.51-8.4Z"/>'},reverse:{d:'<path d="M15.64,8.78H7.25l4.55-4.04c.09-.08.03-.23-.09-.23h-2.61c-.11,0-.21.04-.3.11l-5.74,5.1c-.08.07-.08.2,0,.27l5.74,5.1c.08.07.19.11.3.11h2.61c.12,0,.18-.15.09-.23l-4.55-4.04h8.31c1.73,0,3.14,1.4,3.14,3.14h0c0,1.73-1.4,3.14-3.14,3.14h-.09c-.64,0-1.15.51-1.15,1.15h0c0,.64.51,1.15,1.15,1.15h.17c2.96,0,5.36-2.4,5.36-5.36h0c0-2.96-2.4-5.36-5.36-5.36Z"/><rect x="4.88" y="17.2" width="2.3" height="2.3" rx="1.15" ry="1.15"/><rect x="11.17" y="17.2" width="2.3" height="2.3" rx="1.15" ry="1.15"/><rect x="8.03" y="17.2" width="2.3" height="2.3" rx="1.15" ry="1.15"/>'},user:{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM12,5c1.66,0,3,1.34,3,3s-1.34,3-3,3-3-1.34-3-3,1.34-3,3-3ZM12,19.2c-2.47,0-4.66-1.25-5.96-3.15-.03-.04-.04-.09-.04-.15.13-1.94,4.02-3,6-3s5.86,1.06,6,3c0,.05-.01.1-.04.15-1.3,1.9-3.48,3.15-5.96,3.15Z"/>'},admin:{d:'<path d="M19.5,3H4.5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h15c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM14.4,7c0-.64.51-1.15,1.15-1.15s1.15.51,1.15,1.15v3.7c0,.64-.51,1.15-1.15,1.15s-1.15-.51-1.15-1.15v-3.7ZM4.5,7.85c0-.08.09-.15.2-.15h8.8c.11,0,.2.09.2.2v1.9c0,.11-.09.2-.2.2H4.7c-.11,0-.2-.07-.2-.15v-1.99ZM6.6,16.1c0,.11-.09.2-.2.2h-1.7c-.11,0-.2-.07-.2-.15v-1.99c0-.08.09-.15.2-.15h1.7c.11,0,.2.09.2.2v1.9ZM9.6,17c0,.64-.51,1.15-1.15,1.15s-1.15-.51-1.15-1.15v-3.7c0-.64.51-1.15,1.15-1.15s1.15.51,1.15,1.15v3.7ZM19.5,16.15c0,.08-.09.15-.2.15h-8.8c-.11,0-.2-.09-.2-.2v-1.9c0-.11.09-.2.2-.2h8.8c.11,0,.2.07.2.15v1.99ZM19.5,9.85c0,.08-.09.15-.2.15h-1.7c-.11,0-.2-.09-.2-.2v-1.9c0-.11.09-.2.2-.2h1.7c.11,0,.2.07.2.15v1.99Z"/>'},logout:{d:'<path d="M12.23,6h2.93c.12,0,.24.04.33.13l6.44,5.72c.09.08.09.22,0,.3l-6.44,5.72c-.09.08-.21.13-.33.13h-2.93c-.14,0-.2-.17-.1-.26l5.1-4.53h-9.05c-.11,0-.2-.09-.2-.2v-2.01c0-.11.09-.2.2-.2h9.05l-5.1-4.53c-.1-.09-.04-.26.1-.26Z"/><path d="M10.8,3h-6.8c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h6.8c.11,0,.2-.09.2-.2v-1.9c0-.11-.09-.2-.2-.2h-6.3c-.11,0-.2-.09-.2-.2V5.5c0-.11.09-.2.2-.2h6.3c.11,0,.2-.09.2-.2v-1.9c0-.11-.09-.2-.2-.2Z"/>'},login:{d:'<path d="M6.24,6h2.93c.12,0,.24.04.33.13l6.44,5.72c.09.08.09.22,0,.3l-6.44,5.72c-.09.08-.21.13-.33.13h-2.93c-.14,0-.2-.17-.1-.26l5.1-4.53H2.2c-.11,0-.2-.09-.2-.2v-2.01c0-.11.09-.2.2-.2h9.05l-5.1-4.53c-.1-.09-.04-.26.1-.26Z"/><path d="M13.2,21h6.8c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2h-6.8c-.11,0-.2.09-.2.2v1.9c0,.11.09.2.2.2h6.3c.11,0,.2.09.2.2v13c0,.11-.09.2-.2.2h-6.3c-.11,0-.2.09-.2.2v1.9c0,.11.09.2.2.2Z"/>'},card:{d:'<path d="M20,4H4c-1.11,0-1.99.89-1.99,2v12c-.01,1.11.88,2,1.99,2h16c1.11,0,2-.89,2-2V6c0-1.11-.89-2-2-2ZM19.6,17.4c0,.11-.09.2-.2.2H4.6c-.11,0-.2-.09-.2-.2v-6c0-.11.09-.2.2-.2h14.8c.11,0,.2.09.2.2v6ZM19.6,8.6c0,.11-.09.2-.2.2H4.6c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h14.8c.11,0,.2.09.2.2v2Z"/>'},lock:{d:'<path d="M18,8.5h-1v-2c0-2.76-2.24-5-5-5s-5,2.24-5,5v2h-1c-1.1,0-2,.9-2,2v10c0,1.1.9,2,2,2h12c1.1,0,2-.9,2-2v-10c0-1.1-.9-2-2-2ZM12,17.5c-1.1,0-2-.9-2-2s.9-2,2-2,2,.9,2,2-.9,2-2,2ZM15.1,8.5h-6.2v-2c0-1.71,1.39-3.1,3.1-3.1s3.1,1.39,3.1,3.1v2Z"/>'},unlock:{d:'<circle cx="12" cy="15.5" r="2"/><path d="M18,8.5h-1v-1.79c0-2.58-1.86-4.89-4.42-5.18-2.44-.28-4.67,1.23-5.36,3.51-.03.11.04.23.15.26l1.55.38c.1.03.2-.04.23-.13.46-1.41,1.96-2.33,3.53-1.97,1.39.31,2.32,1.64,2.32,3.07v1.86H6c-1.1,0-2,.9-2,2v10c0,1.1.9,2,2,2h12c1.1,0,2-.9,2-2v-10c0-1.1-.9-2-2-2ZM18,20.3c0,.11-.09.2-.2.2H6.2c-.11,0-.2-.09-.2-.2v-9.6c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v9.6Z"/>'},key:{d:'<path d="M22.8,10h-10.15c-.95-2.69-3.75-4.5-6.88-3.88-2.29.45-4.15,2.29-4.64,4.57-.82,3.88,2.13,7.3,5.86,7.3,2.61,0,4.83-1.67,5.65-4h4.35v3.8c0,.11.09.2.2.2h3.6c.11,0,.2-.09.2-.2v-3.8h1.8c.11,0,.2-.09.2-.2v-3.6c0-.11-.09-.2-.2-.2ZM7,14c-1.1,0-2-.9-2-2s.9-2,2-2,2,.9,2,2-.9,2-2,2Z"/>'},location:{d:'<path d="M12,1.95c-3.87,0-7,3.15-7,7.03,0,4.82,5.85,11.75,6.85,12.9.08.09.21.09.29,0,1-1.15,6.85-8.07,6.85-12.9,0-3.89-3.13-7.03-7-7.03ZM14.42,9.61c-.21.87-.93,1.59-1.8,1.8-1.86.45-3.5-1.19-3.05-3.05.21-.87.93-1.59,1.8-1.8,1.86-.45,3.5,1.19,3.05,3.05Z"/>'},map:{d:'<path d="M20.5,3l-.16.03-5.17,2c-.11.04-.23.05-.35,0l-5.66-1.98c-.11-.04-.22-.04-.32,0l-5.48,1.85c-.22.07-.36.27-.36.5v15.1c0,.28.22.5.5.5l.16-.03,5.17-2c.11-.04.23-.05.35,0l5.66,1.98c.11.04.22.04.32,0l5.5-1.85c.2-.07.34-.26.34-.47V3.5c0-.28-.22-.5-.5-.5ZM15,18.79c0,.1-.1.18-.2.14l-5.47-1.92c-.2-.07-.33-.26-.33-.47V5.21c0-.1.1-.18.2-.14l5.47,1.92c.2.07.33.26.33.47v11.32Z"/>'},route:{d:'<path d="M9,6c0,1.39-.95,2.57-2.25,2.9-.24.07-.49.1-.75.1s-.51-.03-.75-.1c-1.3-.33-2.25-1.51-2.25-2.9,0-1.66,1.34-3,3-3s3,1.34,3,3Z"/><path d="M21,18c0,1.66-1.34,3-3,3s-3-1.34-3-3c0-1.39.95-2.57,2.25-2.9.24-.07.49-.1.75-.1s.51.03.75.1c1.3.33,2.25,1.51,2.25,2.9Z"/><path d="M19,7v7.13c-.32-.09-.65-.13-1-.13s-.68.04-1,.13v-7.13c0-1.1-.9-2-2-2s-2,.9-2,2v10c0,2.21-1.79,4-4,4s-4-1.79-4-4v-7.13c.32.09.65.13,1,.13s.68-.04,1-.13v7.13c0,1.1.9,2,2,2s2-.9,2-2V7c0-2.21,1.79-4,4-4s4,1.79,4,4Z"/>'},transfer:{d:'<path d="M12,2C6.49,2,2,6.49,2,12s4.49,10,10,10,10-4.49,10-10S17.51,2,12,2ZM12,20.25c-4.55,0-8.25-3.7-8.25-8.25S7.45,3.75,12,3.75s8.25,3.7,8.25,8.25-3.7,8.25-8.25,8.25Z"/><path d="M8.9,11.1h2.17c-.9.95-1.8,1.91-2.71,2.86-.08.08-.21.08-.29,0l-2.72-2.86h1.71c.25-3.03,3.05-5.43,6.46-5.43.76,0,1.48.12,2.16.33-.27-.03-.55-.05-.83-.05-3.19,0-5.8,2.28-5.95,5.14h0Z"/><path d="M15.09,12.9h-2.17c.9-.95,1.8-1.91,2.71-2.86.08-.08.21-.08.29,0l2.72,2.86h-1.71c-.25,3.03-3.05,5.43-6.46,5.43-.76,0-1.48-.12-2.16-.33.27.03.55.05.83.05,3.19,0,5.8-2.28,5.95-5.14h0Z"/>'},train:{d:'<path d="M7.53,6.4h3.2c.11,0,.2.09.2.2v5.14c0,.11-.09.2-.2.2h-3.88c-.11,0-.2-.09-.2-.2,0-.31.01-1.01.17-2.39.17-1.42.42-2.44.52-2.8.02-.09.1-.15.19-.15Z"/><path d="M16.47,6.4h-3.2c-.11,0-.2.09-.2.2v5.14c0,.11.09.2.2.2h3.88c.11,0,.2-.09.2-.2,0-.31-.01-1.01-.17-2.39-.17-1.42-.42-2.44-.52-2.8-.02-.09-.1-.15-.19-.15Z"/><path d="M20.18,9.23h.01c-.1-1.17-.29-4.72-2.99-6.3-1.46-.85-4.57-.93-5.21-.93s-3.75.08-5.21.93c-2.68,1.58-2.87,5.12-2.97,6.3-.17,1.91-.55,6.73-.08,8.36.23.79,1.04,1.77,2.86,1.77h10.81c1.82,0,2.63-.98,2.86-1.77.48-1.64.1-6.45-.08-8.36ZM5.35,9.11c.09-.97.24-3.9,2.42-5.21,1.18-.71,3.7-.77,4.22-.77s3.04.07,4.22.77c2.19,1.31,2.34,4.24,2.42,5.21.08.93.22,2.67.24,4.23H5.11c.02-1.56.16-3.31.24-4.23ZM18.71,16.02c-.19.65-.85,1.47-2.32,1.47H7.61c-1.48,0-2.14-.81-2.32-1.47-.13-.44-.18-1.17-.19-2h13.79c0,.83-.06,1.56-.19,2h.01Z"/><path d="M8.79,15.76c0,.57-.46,1.03-1.04,1.03s-1.04-.46-1.04-1.03.46-1.03,1.04-1.03,1.04.46,1.04,1.03Z"/><path d="M17.28,15.76c0,.57-.46,1.03-1.04,1.03s-1.04-.46-1.04-1.03.46-1.03,1.04-1.03,1.04.46,1.04,1.03Z"/><path d="M7.75,19.92h-1.41c-.06,0-.11.02-.15.06l-1.87,2.02h2.21c.07,0,.14-.04.18-.11l1.04-1.97Z"/><path d="M16.25,19.92h1.41c.06,0,.11.02.15.06l1.87,2.02h-2.21c-.07,0-.14-.04-.18-.11l-1.04-1.97Z"/>'},gate:{d:'<path d="M19.3,2H4.7c-.11,0-.2.09-.2.2v19.6c0,.11.09.2.2.2h14.6c.11,0,.2-.09.2-.2V2.2c0-.11-.09-.2-.2-.2ZM9.48,19.33h-2.31v-3.3h2.25v.56h-1.64v.73h1.52v.56h-1.52v.9h1.7v.55ZM11.99,19.33h-.01s-.67-1.14-.67-1.14l-.68,1.14h-.74l1.04-1.72-.94-1.58h.72l.61,1.06.6-1.06h.71l-.94,1.6,1.04,1.7h-.74ZM13.84,19.33h-.61v-3.3h.61v3.3ZM16.83,16.59h-.9v2.74h-.61v-2.74h-.9v-.56h2.41v.56ZM16.85,14.93H7.37c-.11,0-.2-.09-.2-.2v-3.85c0-.11.09-.2.2-.2h1.24c.11,0,.2.09.2.2v2.13c0,.11.09.2.2.2h1.96c.11,0,.2-.09.2-.2v-3.17c0-.11-.09-.2-.2-.2h-3.46c-.11,0-.2-.09-.2-.2v-3.87c0-.11.09-.2.2-.2h1.24c.11,0,.2.09.2.2v2.08c0,.11.09.2.2.2h1.82c.11,0,.2-.09.2-.2v-2.78c0-.11.09-.2.2-.2h1.28c.11,0,.2.09.2.2v2.78c0,.11.09.2.2.2h1.96c.11,0,.2-.09.2-.2v-2.08c0-.11.09-.2.2-.2h1.1c.11,0,.2.09.2.2v3.87c0,.11-.09.2-.2.2h-3.46c-.11,0-.2.09-.2.2v3.17c0,.11.09.2.2.2h1.96c.11,0,.2-.09.2-.2v-2.13c0-.11.09-.2.2-.2h1.24c.11,0,.2.09.2.2v4.05Z"/>'},chat:{d:'<path d="M20,2H4c-1.1,0-2,.91-2,2.03v17.77c0,.18.22.27.34.14l3.51-3.56c.09-.1.22-.15.36-.15h13.79c1.1,0,2-.91,2-2.03V4.03c0-1.12-.9-2.03-2-2.03ZM18,15.13c0,.11-.09.2-.2.2H6.2c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v2ZM18,11.11c0,.11-.09.2-.2.2H6.2c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v2ZM18,7.1c0,.11-.09.2-.2.2H6.2c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v2Z"/>'},"chat-bubble":{d:'<path d="M20,2H4c-1.1,0-2,.91-2,2.03v17.77c0,.18.22.27.34.14l3.51-3.56c.09-.1.22-.15.36-.15h13.79c1.1,0,2-.91,2-2.03V4.03c0-1.12-.9-2.03-2-2.03Z"/>'},send:{d:'<path d="M2.28,20.73l19.6-8.55c.16-.07.16-.29,0-.36L2.28,3.27c-.13-.06-.27.04-.27.18v6.41c0,.1.06.18.16.2l14.33,1.94-14.33,1.94c-.1.01-.17.1-.17.2v6.41c0,.14.15.24.28.18Z"/>'},mail:{d:'<path d="M20,4H4c-1.1,0-1.99.89-1.99,1.99h0c0,.18.09.34.23.43l9.49,6.28c.16.1.37.1.53,0l9.5-6.28c.15-.09.24-.25.24-.42h0c0-1.1-.9-2-2-2Z"/><path d="M11.73,14.91L2.24,8.63c-.1-.06-.23,0-.23.13v9.24c0,1.1.89,2,1.99,2h16c1.1,0,2-.9,2-2v-9.24c0-.12-.13-.19-.23-.13l-9.51,6.28c-.16.1-.37.1-.53,0Z"/>'},"bar-chart":{d:'<rect x="5" y="9.2" width="2.5" height="9.8" rx=".2" ry=".2"/><rect x="16.5" y="13" width="2.5" height="6" rx=".2" ry=".2"/><rect x="10.75" y="5" width="2.5" height="14" rx=".2" ry=".2"/>'},"pie-chart":{d:'<path d="M11.1,3.23v17.54c0,.12-.11.22-.23.2-4.45-.55-7.87-4.36-7.87-8.97S6.42,3.58,10.87,3.03c.12-.02.23.08.23.2Z"/><path d="M12.93,3.23v7.66c0,.11.09.2.2.2h7.64c.12,0,.22-.11.2-.23-.51-4.08-3.74-7.33-7.82-7.84-.12-.02-.23.08-.23.2Z"/><path d="M12.93,13.11v7.66c0,.12.11.22.23.2,4.08-.51,7.31-3.75,7.82-7.84.02-.12-.08-.23-.2-.23h-7.64c-.11,0-.2.09-.2.2Z"/>'},table:{d:'<path d="M19.5,3H4.5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h15c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM10.5,18.8c0,.11-.09.2-.2.2h-5.6c-.11,0-.2-.09-.2-.2v-8.6c0-.11.09-.2.2-.2h5.6c.11,0,.2.09.2.2v8.6ZM19.5,18.8c0,.11-.09.2-.2.2h-6.6c-.11,0-.2-.09-.2-.2v-8.6c0-.11.09-.2.2-.2h6.6c.11,0,.2.09.2.2v8.6ZM19.5,7.8c0,.11-.09.2-.2.2H4.7c-.11,0-.2-.09-.2-.2v-2.6c0-.11.09-.2.2-.2h14.6c.11,0,.2.09.2.2v2.6Z"/>'},compare:{d:'<path d="M11.8,1h-1.6c-.11,0-.2.09-.2.2v1.8h-5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h5v1.8c0,.11.09.2.2.2h1.6c.11,0,.2-.09.2-.2V1.2c0-.11-.09-.2-.2-.2ZM10,18h-5l5-6v6Z"/><path d="M19,3h-4.8c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2h4.6c.11,0,.2.09.2.2v12.8l-5-6v8.8c0,.11.09.2.2.2h4.8c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2Z"/>'},image:{d:'<path d="M19,3H5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM18.59,18.79H5.41c-.11,0-.2-.09-.2-.2V5.41c0-.11.09-.2.2-.2h13.18c.11,0,.2.09.2.2v10.16l-3.03-4.59c-.08-.12-.25-.12-.33,0l-3.03,4.45c-.08.11-.25.12-.33,0l-2.07-2.83c-.08-.11-.25-.11-.33,0l-2.96,4.33c-.1.14,0,.35.15.35h11.92v1.31c0,.11-.09.2-.2.2Z"/><circle cx="8.22" cy="8.48" r="1.54"/>'},camera:{d:'<path d="M20,5.39h-3c-.11,0-.21-.04-.29-.12l-1.59-1.65c-.08-.08-.18-.12-.29-.12h-5.66c-.11,0-.21.04-.29.12l-1.59,1.65c-.08.08-.18.12-.29.12h-3c-1.1,0-2,.85-2,1.89v11.33c0,1.04.9,1.89,2,1.89h16c1.1,0,2-.85,2-1.89V7.28c0-1.04-.9-1.89-2-1.89ZM12,17.94c-2.76,0-5-2.24-5-5s2.24-5,5-5,5,2.24,5,5-2.24,5-5,5Z"/><circle cx="12" cy="12.94" r="3"/>'},play:{d:'<path d="M6.41,5.21v13.59c0,.16.18.26.31.17l10.59-6.79c.13-.08.13-.27,0-.35L6.73,5.03c-.14-.09-.31.01-.31.17Z"/>'},pause:{d:'<rect x="6" y="5" width="4" height="14" rx=".2" ry=".2"/><rect x="14" y="5" width="4" height="14" rx=".2" ry=".2"/>'},plugin:{d:'<path d="M11.9,8.83l-5.22-3.04,4.31-2.51c.63-.37,1.41-.37,2.03,0l4.31,2.51-5.22,3.04s-.06.03-.1.03-.07,0-.1-.03Z"/><path d="M9.32,13.68v6.08l-4.31-2.51c-.63-.36-1.02-1.04-1.02-1.78v-5.02l5.22,3.04c.06.04.1.1.1.18Z"/><path d="M20,8.53v.11l-6,3.5c-.55.32-.88.9-.88,1.54v6.99l-.1.06c-.2.11-.41.19-.62.24-.13.02-.26.04-.39.04s-.26-.01-.39-.04c-.22-.04-.43-.12-.62-.24l-.1-.06v-6.99c0-.63-.33-1.22-.88-1.54l-6-3.5v-.11c0-.14.01-.27.04-.4.02-.09.04-.18.07-.26.06-.17.14-.33.23-.47.04-.05.08-.11.12-.16h0c.04-.05.09-.1.13-.15.12-.13.27-.24.42-.33l.1-.06,6,3.5c.27.16.58.24.88.24s.61-.08.88-.24l6-3.5.1.06c.16.09.3.2.42.33.05.05.09.09.13.15h0c.04.05.08.11.12.16.1.15.17.31.23.47.03.08.05.17.07.26.03.13.04.27.04.4Z"/><path d="M14.78,13.5l5.22-3.04v5.02c0,.73-.39,1.41-1.02,1.78l-4.31,2.51v-6.08c0-.07.04-.14.1-.18Z"/><path d="M20,8.53v.11l-6,3.5c-.55.32-.88.9-.88,1.54v6.99l-.1.06c-.2.11-.41.19-.62.24-.13.02-.26.04-.39.04s-.26-.01-.39-.04c-.22-.04-.43-.12-.62-.24l-.1-.06v-6.99c0-.63-.33-1.22-.88-1.54l-6-3.5v-.11c0-.14.01-.27.04-.4.02-.09.04-.18.07-.26.06-.17.14-.33.23-.47.04-.05.08-.11.12-.16h0c.04-.05.09-.1.13-.15.12-.13.27-.24.42-.33l.1-.06,6,3.5c.27.16.58.24.88.24s.61-.08.88-.24l6-3.5.1.06c.16.09.3.2.42.33.05.05.09.09.13.15h0c.04.05.08.11.12.16.1.15.17.31.23.47.03.08.05.17.07.26.03.13.04.27.04.4Z"/>'},bookmark:{d:'<path d="M17,3H7c-1.1,0-1.99.91-1.99,2.01v15.79c0,.14.14.24.27.19l6.52-2.81c.13-.05.27-.05.39,0l6.52,2.81c.13.06.28-.04.28-.18V5.01c0-1.11-.9-2.01-2-2.01Z"/>'},share:{d:'<path d="M18,16.12c-.76,0-1.44.3-1.96.77l-7.13-4.15c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5,1.25.81,2.04.81,1.66,0,3-1.34,3-3s-1.34-3-3-3-3,1.34-3,3c0,.24.04.47.09.7l-7.05,4.11c-.54-.5-1.25-.81-2.04-.81-1.66,0-3,1.34-3,3s1.34,3,3,3c.79,0,1.5-.31,2.04-.81l7.12,4.16c-.05.21-.08.43-.08.65,0,1.61,1.31,2.92,2.92,2.92s2.92-1.31,2.92-2.92-1.31-2.92-2.92-2.92Z"/>'},preset:{d:'<path d="M18.7,17V7.7c0-.11.09-.2.2-.2h1.9c.11,0,.2.09.2.2v9.5s0,0,0,0c0,1.27-1.03,2.3-2.3,2.3H6.2c-.11,0-.2-.09-.2-.2v-1.9c0-.11.09-.2.2-.2h12.3c.11,0,.2-.09.2-.2Z"/><path d="M3,13.38v1.62c0,.11.09.2.2.2h1.9c.11,0,.2-.09.2-.2v-1.77c0-1.27,1.03-2.3,2.3-2.3h4.85l-4.55,4.04c-.09.08-.03.23.09.23h2.61c.11,0,.21-.04.3-.11l5.74-5.1c.08-.07.08-.2,0-.27l-5.74-5.1c-.08-.07-.19-.11-.3-.11h-2.61c-.12,0-.18.15-.09.23l4.55,4.04h-4.85c-2.54,0-4.6,2.06-4.6,4.6Z"/>'},puzzle:{d:'<path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>'},star:{d:'<path d="M16.66,14.35c-.06.04-.08.12-.07.19l1.51,6.46c.04.18-.15.31-.3.22l-5.7-3.43c-.06-.04-.14-.04-.2,0l-5.7,3.43c-.15.09-.34-.04-.3-.22l1.51-6.46c.02-.07,0-.15-.06-.19l-5.03-4.35c-.13-.12-.06-.34.11-.35l6.63-.56c.07-.01.14-.06.17-.12l2.58-6.1c.07-.16.31-.16.37,0l2.59,6.09c.03.06.1.11.17.12l6.63.57c.17.01.24.23.11.35l-5.02,4.35Z"/>'},"star-outline":{d:'<path d="M21.68,10c.13-.12.06-.34-.11-.35l-6.63-.57c-.07,0-.14-.05-.17-.12l-2.59-6.08c-.07-.16-.3-.16-.37,0l-2.59,6.09c-.03.07-.09.12-.17.12l-6.62.56c-.18.01-.25.23-.11.35l5.03,4.35c.06.05.08.12.06.2l-1.51,6.46c-.04.17.15.31.3.22l5.69-3.43c.06-.04.14-.04.21,0l5.69,3.43c.15.09.34-.04.3-.22l-1.5-6.46c-.02-.07,0-.15.06-.2l5.02-4.35ZM15.68,17.68c.04.17-.15.31-.3.22l-3.27-1.97c-.06-.04-.14-.04-.21,0l-3.26,1.97c-.15.09-.34-.04-.3-.22l.87-3.71c.02-.07,0-.15-.06-.2l-2.88-2.5c-.13-.12-.06-.34.11-.35l3.8-.33c.07,0,.14-.05.17-.12l1.47-3.49c.07-.16.3-.16.37,0l1.48,3.5c.03.07.09.12.17.12l3.8.33c.18.02.25.23.11.35l-2.88,2.5c-.06.05-.08.12-.06.2l.87,3.71Z"/>'},link:{d:'<path d="M3.96,11.38c.29-1.47,1.66-2.48,3.16-2.48h3.68c.11,0,.2-.09.2-.2v-1.5c0-.11-.09-.2-.2-.2h-3.58c-2.61,0-4.94,1.91-5.19,4.51-.29,2.98,2.05,5.49,4.98,5.49h3.8c.11,0,.2-.09.2-.2v-1.5c0-.11-.09-.2-.2-.2h-3.8c-1.91,0-3.42-1.74-3.04-3.72Z"/><rect x="8" y="11" width="8" height="2" rx=".2" ry=".2"/><path d="M16.78,7h-3.58c-.11,0-.2.09-.2.2v1.5c0,.11.09.2.2.2h3.68c1.5,0,2.88,1.01,3.16,2.48.38,1.98-1.13,3.72-3.04,3.72h-3.8c-.11,0-.2.09-.2.2v1.5c0,.11.09.2.2.2h3.8c2.92,0,5.26-2.51,4.98-5.49-.25-2.6-2.58-4.51-5.19-4.51Z"/>'},code:{d:'<path d="M9.87,17.5h-2.32c-.1,0-.2-.04-.28-.12l-5.21-5.24c-.07-.07-.07-.19,0-.27l5.21-5.25c.08-.08.18-.12.28-.12h2.33c.11,0,.17.16.08.24l-5.18,5.19s-.04.1,0,.14l5.17,5.19c.08.08.03.24-.08.24Z"/><path d="M14.13,6.5h2.32c.1,0,.2.04.28.12l5.21,5.24c.07.07.07.19,0,.27l-5.21,5.25c-.08.08-.18.12-.28.12h-2.33c-.11,0-.17-.16-.08-.24l5.18-5.19s-.04-.1,0-.14l-5.17-5.19c-.08-.08-.03-.24.08-.24Z"/>'},layer:{d:'<path d="M11.87,18.92l-7.23-5.55c-.07-.06-.18-.06-.25,0l-1.31,1.01c-.1.08-.1.24,0,.32l8.8,6.76c.07.06.18.06.25,0l8.8-6.76c.1-.08.1-.24,0-.32l-1.32-1.02c-.07-.06-.18-.06-.25,0l-7.24,5.56c-.07.06-.18.06-.25,0Z"/><path d="M11.88,16.38c.07.06.18.06.25,0l7.34-5.65,1.46-1.11c.1-.08.1-.24,0-.32L12.12,2.54c-.07-.06-.18-.06-.25,0L3.08,9.3c-.1.08-.1.24,0,.32l1.45,1.11,7.35,5.65Z"/>'},sparkle:{d:'<path d="M19.04,8.67l1.02-2.24s.05-.08.1-.1l2.24-1.02c.15-.07.15-.29,0-.36l-2.24-1.02s-.08-.05-.1-.1l-1.02-2.24c-.07-.15-.29-.15-.36,0l-1.02,2.24s-.05.08-.1.1l-2.24,1.02c-.15.07-.15.29,0,.36l2.24,1.02s.08.05.1.1l1.02,2.24c.07.15.29.15.36,0Z"/><path d="M11.48,9.48l-2.24-4.93c-.07-.15-.29-.15-.36,0l-2.24,4.93s-.05.08-.1.1l-4.93,2.24c-.15.07-.15.29,0,.36l4.93,2.24s.08.05.1.1l2.24,4.93c.07.15.29.15.36,0l2.24-4.93s.05-.08.1-.1l4.93-2.24c.15-.07.15-.29,0-.36l-4.93-2.24s-.08-.05-.1-.1Z"/><path d="M18.68,15.33l-1.02,2.24s-.05.08-.1.1l-2.24,1.02c-.15.07-.15.29,0,.36l2.24,1.02s.08.05.1.1l1.02,2.24c.07.15.29.15.36,0l1.02-2.24s.05-.08.1-.1l2.24-1.02c.15-.07.15-.29,0,.36l-2.24-1.02s-.08-.05-.1-.1l-1.02-2.24c-.07-.15-.29-.15-.36,0Z"/>'},tag:{d:'<path d="M21.41,11.58L12.41,2.58c-.36-.36-.86-.58-1.41-.58h-7c-1.1,0-2,.9-2,2v7c0,.55.22,1.05.59,1.42l9,9c.36.36.86.58,1.41.58s1.05-.22,1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42ZM5.5,7c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5,1.5.67,1.5,1.5-.67,1.5-1.5,1.5Z"/>'},palette:{d:'<path d="M12,3c4.97,0,9,3.58,9,8,0,2.76-2.24,5-5,5h-1.77c-.83,0-1.5.67-1.5,1.5,0,.38.15.73.38.99.24.27.39.62.39,1.01,0,.83-.69,1.5-1.5,1.5-4.97,0-9-4.03-9-9S7.03,3,12,3ZM7.95,12c.75,0,1.35-.6,1.35-1.35s-.6-1.35-1.35-1.35-1.35.6-1.35,1.35.6,1.35,1.35,1.35ZM16.05,12c.75,0,1.35-.6,1.35-1.35s-.6-1.35-1.35-1.35-1.35.6-1.35,1.35.6,1.35,1.35,1.35ZM12,9.3c.75,0,1.35-.6,1.35-1.35s-.6-1.35-1.35-1.35-1.35.6-1.35,1.35.6,1.35,1.35,1.35Z"/>'},design:{d:'<path d="M20.71,5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41,0l-4,4,3.75,3.75,4-4c.39-.39.39-1.02,0-1.41Z"/><path d="M7.3,12.95l-4.24,4.24s-.06.09-.06.14v3.47c0,.11.09.2.2.2h3.47c.05,0,.1-.02.14-.06l4.24-4.24-3.75-3.75Z"/><path d="M4.5,4.5l-1.17,1.17c-.39.39-.39,1.02,0,1.41l.54.54c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l.54.54c.39.39,1.02.39,1.41,0l1.17-1.17,1.17-1.17c.39-.39.39-1.02,0-1.41L7.08,3.33c-.39-.39-1.02-.39-1.41,0l-1.17,1.17Z"/>'},eye:{d:'<path d="M21.32,11.38c-2.73-4.22-5.83-6.38-9.32-6.38s-6.59,2.16-9.32,6.38c-.25.38-.25.86,0,1.24,2.73,4.22,5.83,6.38,9.32,6.38s6.59-2.16,9.32-6.38c.25-.38.25-.86,0-1.24ZM12,16.25c-2.35,0-4.25-1.9-4.25-4.25s1.9-4.25,4.25-4.25,4.25,1.9,4.25,4.25-1.9,4.25-4.25,4.25Z"/><circle cx="12" cy="12" r="2.8"/>'},loading:{d:'<path d="M20.34,9.69h0c-.61.17-.98.76-.9,1.39.31,2.47-.61,5.08-2.82,6.84-2.37,1.88-5.76,2.12-8.37.58-4.21-2.49-4.93-8.01-1.85-11.48,1.49-1.68,3.56-2.53,5.64-2.52.63,0,1.17-.43,1.27-1.06h0c.11-.74-.45-1.43-1.2-1.44-3.15-.03-6.3,1.41-8.31,4.27-2.64,3.75-2.32,8.99.76,12.39,4.07,4.51,11.01,4.38,14.93-.03,2-2.25,2.79-5.16,2.43-7.93-.1-.74-.85-1.22-1.57-1.02Z"/>'},tabs:{d:'<path d="M20,4H4c-1.11,0-1.99.89-1.99,2v12c-.01,1.11.88,2,1.99,2h16c1.11,0,2-.89,2-2V6c0-1.11-.89-2-2-2ZM10.25,6.6c0-.11.09-.2.2-.2h3.05c.11,0,.2.09.2.2v2c0,.11-.09.2-.2.2h-3.05c-.11,0-.2-.09-.2-.2v-2ZM4.4,6.6c0-.11.09-.2.2-.2h3.06c.11,0,.2.09.2.2v2c0,.11-.09.2-.2.2h-3.06c-.11,0-.2-.09-.2-.2v-2ZM19.6,17.4c0,.11-.09.2-.2.2H4.6c-.11,0-.2-.09-.2-.2v-6c0-.11.09-.2.2-.2h14.8c.11,0,.2.09.2.2v6ZM19.6,8.6c0,.11-.09.2-.2.2h-3.11c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h3.11c.11,0,.2.09.2.2v2Z"/>'},touch:{d:'<path d="M20,14.99s0-.05,0-.07v-4.61c0-.8-.65-1.45-1.45-1.45-.68,0-1.26.48-1.41,1.11v-.18c0-.8-.65-1.45-1.45-1.45-.69,0-1.26.48-1.41,1.12v-.34c0-.8-.65-1.45-1.45-1.45-.68,0-1.26.48-1.41,1.11V3.95c0-.8-.65-1.45-1.45-1.45s-1.45.65-1.45,1.45v9.8l-1.87-2.67c-.22-.31-.55-.52-.94-.59-.38-.07-.77.02-1.08.24-.32.22-.53.56-.6.95-.07.39.02.77.24,1.08l3.86,5.54.07.1c.55.92,1.33,1.69,2.25,2.23.97.57,2.07.87,3.2.87,3.49,0,6.33-2.84,6.35-6.33,0-.02,0-.04,0-.07v-.06s0-.06,0-.06Z"/>'},window:{d:'<rect x="2.5" y="18.5" width="19" height="2.5" rx=".2" ry=".2"/><path d="M19.11,3H4.89c-1.04,0-1.89.9-1.89,2v10c0,1.1.85,2,1.89,2h14.21c1.04,0,1.89-.9,1.89-2V5c0-1.1-.85-2-1.89-2ZM19.5,15.3c0,.11-.09.2-.2.2H4.7c-.11,0-.2-.09-.2-.2V4.7c0-.11.09-.2.2-.2h14.6c.11,0,.2.09.2.2v10.6Z"/><rect x="7.5" y="7" width="9" height="6" rx=".2" ry=".2"/>'},"pin-angle":{d:'<path d="M5.36,20.56l4.6-4.6c.08-.08.21-.09.29,0l2.59,2.59c.08.08.2.07.28,0l.95-.87c.22-.2.35-.48.36-.77l.06-1.69c.01-.43.16-.85.43-1.21l2.69-3.68c.26-.35.61-.62,1.01-.78l2.01-.77c.36-.14.48-.6.22-.86l-2.39-2.39-2.39-2.39c-.26-.26-.72-.14-.86.22l-.77,2.01c-.15.4-.42.75-.78,1.01l-3.68,2.69c-.36.26-.78.41-1.21.43l-1.69.06c-.29.01-.57.14-.77.36l-.87.95c-.08.08-.08.21,0,.28l2.59,2.59c.08.08.07.21,0,.29l-4.6,4.6c-.56.56-.59,1.45-.06,1.98h0c.53.53,1.41.5,1.98-.06Z"/>'},"unpin-angle":{d:'<path d="M14.92,14h0s-4.92-4.92-4.92-4.92h0l-4.28-4.28c-.08-.08-.2-.08-.28,0l-1.42,1.42c-.08.08-.08.2,0,.28l3.06,3.06c-.28.02-.56.14-.75.36l-.87.95c-.08.08-.08.21,0,.28l2.59,2.59c.08.08.07.21,0,.29l-4.6,4.6c-.56.56-.59,1.45-.06,1.98h0c.53.53,1.41.5,1.98-.06l4.6-4.6c.08-.08.21-.09.29,0l2.59,2.59c.08.08.2.07.28,0l.95-.87c.22-.2.34-.47.36-.75l3.06,3.06c.08.08.2.08.28,0l1.42-1.42c.08-.08.08-.2,0,.28l-4.28-4.28Z"/><path d="M20.86,7.91l-2.39-2.39-2.39-2.39c-.26-.26-.72-.14-.86.22l-.77,2.01c-.15.4-.42.75-.78,1.01l-2.09,1.53,4.5,4.5,1.53-2.09c.26-.35.61-.62,1.01-.78l2.01-.77c.36-.14.48-.6.22-.86Z"/>'},"vi-clss":{d:'<path d="M71.81,17.09c2.12,0,3.84,1.73,3.84,3.84v39.98c0,1.09-.9,1.99-1.99,1.99H6.35c-1.09,0-1.99-.9-1.99-1.99V19.08c0-1.09.9-1.99,1.99-1.99h65.44M73.34,12.52H6.66C2.98,12.52,0,15.51,0,19.18v41.63c0,3.68,2.99,6.66,6.66,6.66h66.67c3.68,0,6.66-2.99,6.66-6.66V19.18c0-3.68-2.99-6.66-6.66-6.66h0Z"/><path d="M14.65,48.82h-3.32v-5.27h4.39l1.46-7.07h-5.85v-5.29h6.95l1.93-9.34h5.46l-1.93,9.34h5.39l1.88-9.34h5.66l-1.95,9.34h3.37v5.29h-4.46l-1.46,7.07h5.93v5.27h-7.03l-1.93,9.34h-5.44l1.88-9.34h-5.42l-1.93,9.34h-5.51s1.93-9.34,1.93-9.34ZM22.67,36.48l-1.44,7.07h5.42l1.41-7.07h-5.39Z"/><path d="M45.23,48.82h-3.32v-5.27h4.39l1.46-7.07h-5.85v-5.29h6.95l1.93-9.34h5.46l-1.93,9.34h5.39l1.88-9.34h5.66l-1.95,9.34h3.37v5.29h-4.46l-1.46,7.07h5.93v5.27h-7.03l-1.93,9.34h-5.44l1.88-9.34h-5.42l-1.93,9.34h-5.51l1.93-9.34h0ZM53.25,36.48l-1.44,7.07h5.42l1.41-7.07h-5.39Z"/>',viewBox:"0 0 80 80"},"vi-line":{d:'<rect x="3" y="15.83" width="18" height="4.67" rx=".2" ry=".2"/><path d="M4.54,11.22h-.98v-1.51h1.29l.43-2.02h-1.72v-1.51h2.05l.57-2.68h1.61l-.57,2.67h1.59l.55-2.67h1.67l-.57,2.67h.99v1.51h-1.31l-.43,2.02h1.74v1.51h-2.07l-.57,2.67h-1.6l.55-2.67h-1.59l-.57,2.67h-1.62l.57-2.67h0ZM6.9,7.69l-.42,2.02h1.59l.42-2.02h-1.59Z"/><path d="M13.54,11.22h-.98v-1.51h1.29l.43-2.02h-1.72v-1.51h2.05l.57-2.67h1.61l-.57,2.67h1.59l.55-2.67h1.67l-.57,2.67h.99v1.51h-1.31l-.43,2.02h1.74v1.51h-2.07l-.57,2.67h-1.6l.55-2.67h-1.59l-.57,2.67h-1.62l.57-2.67h0ZM15.9,7.69l-.42,2.02h1.59l.42-2.02h-1.59Z"/>'},"vi-nbr":{d:'<path d="M3.99,14.91h-.99v-1.74h1.31l.44-2.34h-1.75v-1.75h2.08l.58-3.09h1.63l-.58,3.09h1.61l.56-3.09h1.69l-.58,3.09h1.01v1.75h-1.33l-.44,2.34h1.77v1.74h-2.1l-.58,3.09h-1.63l.56-3.09h-1.62l-.58,3.09h-1.65l.58-3.09h0ZM6.39,10.84l-.43,2.34h1.62l.42-2.34h-1.61Z"/><path d="M19,6h-5c-1.1,0-2,.9-2,2v4.91c0,1.1.9,2,2,2h5c1.1,0,2-.9,2-2v-4.91c0-1.1-.9-2-2-2ZM19.24,12.97c0,.11-.09.2-.2.2h-5.08c-.11,0-.2-.09-.2-.2v-5.03c0-.11.09-.2.2-.2h5.08c.11,0,.2.09.2.2v5.03Z"/>'},"vi-oth":{d:'<path d="M12.25,12.26h-1.92l-.76-2.1h-3.49l-.72,2.1h-1.87L6.9,3h1.86s3.49,9.26,3.49,9.26ZM9.01,8.6l-1.2-3.44-1.18,3.44h2.38Z"/><path d="M13.19,3h3.49c.69,0,1.21.03,1.54.09.34.06.64.19.91.38s.49.45.67.77c.18.32.27.68.27,1.08,0,.43-.11.83-.33,1.19-.22.36-.52.63-.89.81.53.16.94.45,1.23.84s.43.86.43,1.4c0,.42-.09.83-.28,1.23s-.44.72-.76.95c-.32.24-.71.38-1.18.44-.29.03-1,.05-2.12.06h-2.97V3h0ZM14.95,4.54v2.14h1.15c.69,0,1.11-.01,1.28-.03.3-.04.54-.15.71-.33s.26-.43.26-.72-.07-.52-.22-.7c-.15-.18-.37-.29-.66-.33-.17-.02-.68-.03-1.51-.03,0,0-1.01,0-1.01,0ZM14.95,8.22v2.48h1.63c.63,0,1.04-.02,1.21-.06.26-.05.47-.17.64-.37.16-.2.25-.46.25-.79,0-.28-.06-.51-.19-.71-.13-.19-.31-.34-.55-.42-.24-.09-.76-.13-1.56-.13,0,0-1.42,0-1.42,0Z"/><path d="M7.24,20.88h-1.42v-5.21c-.52.47-1.13.82-1.84,1.05v-1.25c.37-.12.77-.34,1.21-.67s.73-.71.9-1.15h1.16v7.24h0Z"/><path d="M14.17,19.59v1.28h-4.99c.05-.49.22-.94.49-1.38s.8-1.01,1.6-1.73c.64-.58,1.04-.97,1.18-1.18.2-.29.29-.57.29-.85,0-.31-.09-.54-.26-.71s-.41-.25-.71-.25-.53.09-.71.26-.28.46-.3.87l-1.42-.14c.08-.76.35-1.31.79-1.64s1-.5,1.67-.5c.73,0,1.31.19,1.73.58.42.38.63.86.63,1.43,0,.32-.06.63-.18.93-.12.29-.31.6-.57.92-.17.21-.48.52-.93.92-.45.4-.73.67-.85.8s-.22.26-.29.38h2.83s0,0,0,0h0Z"/><path d="M15.09,18.96l1.38-.16c.04.34.16.6.35.78s.42.27.7.27c.29,0,.54-.11.74-.32s.3-.51.3-.88c0-.35-.1-.62-.29-.83s-.43-.31-.7-.31c-.18,0-.4.03-.65.1l.16-1.13c.39,0,.68-.07.88-.24s.3-.4.3-.69c0-.24-.07-.44-.22-.58s-.35-.22-.59-.22-.45.08-.62.25-.28.4-.31.72l-1.31-.22c.09-.44.23-.79.41-1.05s.44-.47.77-.61.7-.22,1.11-.22c.7,0,1.26.22,1.68.65.35.35.52.75.52,1.2,0,.63-.36,1.14-1.07,1.51.42.09.77.29,1.02.6.25.31.38.68.38,1.12,0,.63-.24,1.17-.72,1.62s-1.07.67-1.78.67-1.23-.19-1.67-.56-.7-.87-.77-1.47Z"/>'},"vi-stn":{d:'<path d="M9.04,5.97c-.92.15-1.53,1.02-1.36,1.95l.84,5.1.25,1.42c.1.6.59,1.02,1.19,1.02h5.99c.17,0,.35.12.4.27l1.98,5.37c.22.6.87.9,1.44.67h0c.59-.22.89-.87.67-1.45l-1.78-4.87-.52-1.4c-.22-.62-.84-1.05-1.51-1.05h-4.43c-.17,0-.35-.12-.37-.3l-.22-1.4c0-.1.07-.22.17-.22h3.04c.42,0,.74-.35.74-.75h0c0-.42-.35-.75-.74-.75h-3.22c-.15,0-.3-.12-.32-.27l-.32-1.95c-.15-.92-.99-1.57-1.91-1.4Z"/><path d="M8.59,3.63c0,.9.73,1.62,1.62,1.62s1.63-.72,1.63-1.62-.72-1.63-1.63-1.63-1.63.73-1.62,1.63Z"/><path d="M13.8,16.97c-.53,1.75-2.13,3.03-4.05,3.03-2.35,0-4.25-1.9-4.25-4.25,0-1.27.57-2.39,1.45-3.17l-.36-2.21c-1.84,1.09-3.08,3.09-3.08,5.38,0,3.45,2.8,6.25,6.25,6.25,3.03,0,5.56-2.16,6.13-5.03h-2.08Z"/>'},"vi-sub":{d:'<rect x="3" y="16.02" width="18" height="4.73" rx=".2" ry=".2"/><path d="M13.09,4.65h2.58l.43,1.69h.8l-.08-2.9c0-.11-.09-.19-.2-.19H7.37c-.11,0-.2.09-.2.2l-.07,2.9h.8l.43-1.69h2.58c.02,1.25.02,2.51.02,3.76v.71c0,1.52,0,2.6-.03,4.09l-1.6.13v.93h5.4v-.93l-1.6-.13c-.03-1.5-.03-2.59-.03-4.1v-.7c0-1.27,0-2.52.02-3.76h0Z"/>'},"vi-text":{d:'<path d="M3.86,4.36v15.29h16.29V4.36H3.86ZM19.15,18.65H4.85V5.35h14.29v13.29h0Z"/><rect x="3" y="3.5" width="2.57" height="2.57"/><rect x="3" y="17.93" width="2.57" height="2.57"/><rect x="18.43" y="3.5" width="2.57" height="2.57"/><rect x="18.43" y="17.93" width="2.57" height="2.57"/><path d="M12.89,8.59h2.11l.36,1.41h.65l-.07-2.57h-7.89l-.06,2.57h.65l.36-1.41h2.11c.01,1.04.02,2.08.02,3.12v.59c0,1.26,0,2.16-.02,3.39l-1.31.11v.77h4.42v-.77l-1.31-.11c-.02-1.25-.02-2.14-.02-3.4v-.58c0-1.05,0-2.09.02-3.12Z"/>'},"vi-way":{d:'<path d="M11.22,13h-2.61c-.11,0-.21-.04-.3-.11L2.56,7.88c-.08-.07-.08-.19,0-.26l5.75-5.01c.08-.07.19-.11.3-.11h2.61c.12,0,.18.15.09.23l-4.55,3.96h8.07c.1,0,.18.08.18.18v1.76c0,.1-.08.18-.18.18H6.76l4.55,3.97c.09.08.04.23-.09.23Z"/><path d="M12.78,11h2.61c.11,0,.21.04.3.11l5.75,5.01c.08.07.08.19,0,.26l-5.75,5.01c-.08.07-.19.11-.3.11h-2.61c-.12,0-.18-.15-.09-.23l4.55-3.96h-8.07c-.1,0-.18-.08-.18-.17v-1.76c0-.1.08-.18.18-.18h8.07s-4.55-3.97-4.55-3.97c-.09-.08-.04-.23.09-.23Z"/>'},calendar:{d:'<path d="M17.39,6.4v-3.2c0-.11-.09-.2-.2-.2h-2.03c-.11,0-.2.09-.2.2v3.2c0,.11-.09.2-.2.2h-5.51c-.11,0-.2-.09-.2-.2v-3.2c0-.11-.09-.2-.2-.2h-2.03c-.11,0-.2.09-.2.2v3.2c0,.11-.09.2-.2.2h-2.72c-.11,0-.2.09-.2.2v14c0,.11.09.2.2.2h16.6c.11,0,.2-.09.2-.2V6.8c0-.11-.09-.2-.2-.2h-2.71c-.11,0-.2-.09-.2-.2ZM17.8,18.72H6.2c-.11,0-.2-.09-.2-.2v-7.75c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v7.75c0,.11-.09.2-.2.2Z"/><circle cx="8.38" cy="12.95" r="1.24"/><circle cx="8.38" cy="16.4" r="1.24"/><circle cx="12" cy="12.95" r="1.24"/><circle cx="12" cy="16.4" r="1.24"/><circle cx="15.62" cy="12.95" r="1.24"/><circle cx="15.62" cy="16.4" r="1.24"/>'},payment:{d:'<path d="M18.61,14.98l.77.75-.99.97-1.61-1.58c2.73-.78,4.72-3.25,4.72-6.18,0-3.56-2.93-6.44-6.55-6.44-2.98,0-5.5,1.96-6.29,4.64l-1.61-1.58.99-.97.77.75c.2-.33.43-.64.68-.93l-1.4-1.38-.81.8-1.8,1.77,12.88,12.66,1.8-1.77.81-.8-1.4-1.38c-.3.25-.61.47-.95.67ZM15.73,12.53h-1.63s0-1.45,0-1.45h-1.87v-1.06s1.87,0,1.87,0v-.79s-1.87,0-1.87,0v-1.05h1.51l-2.01-3.47h1.75c.79,1.61,1.29,2.67,1.5,3.18h.04c.03-.07.06-.17.1-.28.06-.18.31-.7.74-1.58l.64-1.33h1.65s-2.06,3.47-2.06,3.47h1.46v1.05h-1.81s0,.79,0,.79h1.81v1.06h-1.81v1.45Z"/><polygon points="16 17.57 12 21.5 2.5 12.17 6.5 8.23 7.44 9.16 4.26 12.28 11.88 19.77 15.06 16.65 16 17.57"/><ellipse cx="7.41" cy="12.41" rx=".93" ry=".91"/><ellipse cx="9.58" cy="14.54" rx=".93" ry=".91"/><ellipse cx="11.75" cy="16.67" rx=".93" ry=".91"/>'},subrail:{d:'<path d="M11.81,19.66c-.47-.01-.92-.07-1.37-.16-.17-.04-.35.02-.48.14l-1.05,1.05c-.29.29-.16.77.23.89.91.27,1.86.41,2.86.41s1.95-.14,2.86-.41c.39-.12.51-.6.23-.89l-1.05-1.05c-.13-.13-.31-.18-.48-.14-.56.12-1.14.17-1.74.16Z"/><path d="M11.86,2c-5.39.08-9.79,4.48-9.86,9.88-.04,3.45,1.67,6.51,4.3,8.34.21.15.5.12.68-.06l1.41-1.41h0l2.64-2.64c.06-.06.1-.15.1-.24v-1.87c0-.5-.41-.91-.91-.91h-1.17c-.19,0-.34-.15-.34-.34v-2.03c0-.41.18-.79.49-1.05.46-.39.97-.75,1.66-.87.16-.03.28-.17.28-.34v-1.64c0-.21-.18-.37-.39-.34-.62.08-1.4.34-2.2.76-.89.46-1.54,1.16-1.86,1.85-.08.18-.12.37-.12.56v4.04c0,.62.5,1.11,1.11,1.11h.83c.31,0,.46.37.24.59l-2.09,2.09c-1.37-1.34-2.25-3.19-2.31-5.23-.12-3.83,2.58-7.06,6.18-7.76.14-.03.24-.14.26-.27.11-.62.61-1.08,1.22-1.08s1.11.47,1.22,1.08c.02.14.13.25.26.27,3.52.69,6.18,3.79,6.18,7.52,0,2.15-.88,4.09-2.31,5.48l-2.1-2.1c-.22-.22-.06-.59.24-.59h.83c.62,0,1.11-.5,1.11-1.11v-4.04c0-.19-.04-.39-.12-.56-.31-.69-.97-1.38-1.86-1.85-.8-.42-1.58-.68-2.2-.76-.21-.03-.39.13-.39.34v1.64c0,.16.12.31.28.34.69.12,1.2.48,1.66.87.31.26.48.65.48,1.05v2.03c0,.19-.15.34-.34.34h-1.17c-.5,0-.91.41-.91.91v1.87c0,.09.04.18.1.24l2.64,2.64,1.4,1.4c.18.18.47.21.68.06,2.6-1.81,4.3-4.81,4.3-8.22,0-5.57-4.55-10.08-10.14-10Z"/>'},ticket:{d:'<path d="M15.03,4.62l-2.91,5.6-3.82-2.54c-.22-.15-.49-.17-.72-.04l-4.88,2.08c-.12.07-.19.2-.19.35v8.5c0,.19.09.35.26.37.75.08,1.1-.14,1.86-.46.97-.4,1.71-.94,2.24-1.42.4-.36.94-.49,1.43-.54l1.58-.23-.34.67c-.31.6-.13,1.36.39,1.7.34.23.74.22,1.07.02.04.27.19.52.41.68.41.27.94.11,1.18-.35l.49-.95,2.38,1.34c.1.06.23.02.29-.09l5.74-11.07c.06-.11.02-.24-.09-.3l-6.07-3.42c-.1-.06-.23-.02-.29.09ZM7.14,13.42c.34-.6.81-.96,1.34-.96.46,0,.89.29,1.21.77l-2.55.2ZM15.17,17.15c-.06.11-.19.15-.29.09l-2.29-1.29h.12c.78,0,1.4-.56,1.4-1.45s-.78-1.47-1.56-1.47h-.23l3.25-6.25c.06-.11.19-.15.29-.09l3.47,1.95c.1.06.14.19.09.3l-4.26,8.21Z"/>'},time:{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM12,20c-4.42,0-8-3.58-8-8s3.58-8,8-8,8,3.58,8,8-3.58,8-8,8Z"/><path d="M12,6.5c-.55,0-1,.45-1,1v4.79c0,.2.08.39.22.53l3.29,3.29c.39.39,1.02.39,1.41,0s.39-1.02,0-1.41l-2.92-2.92V7.5c0-.55-.45-1-1-1Z"/>'},bjsubway:{d:'<path d="M13.34,9.4h-3.6v5.15h3.64s.19-.03.19-.03c.57-.12.99-.62.99-1.22s-.43-1.1-.99-1.22h-.07s-.03-.01-.03-.01c-.03-.01-.06-.05-.06-.08s.02-.07.06-.08h.03s.09-.02.09-.02c.57-.12,1.01-.63,1.01-1.24s-.43-1.12-1.01-1.24l-.22-.02h0s-.02,0-.02,0h0ZM12,2c4.83,0,8.86,3.43,9.8,7.98v.03s-2.25,0-2.25,0l-.09-.33c-.99-3.18-3.96-5.49-7.46-5.49-4.31,0-7.81,3.5-7.81,7.81s3.5,7.81,7.81,7.81c3.51,0,6.47-2.31,7.46-5.49l.07-.27h-2.83l-.02.11c-.16.72-.39,1.43-.71,2.11l-.18.35H7.37V7.37h8.42l.16.3c.64,1.36.96,2.83.97,4.3v.03s2.9,0,2.9,0h2.19c0,5.52-4.48,10-10,10S2,17.52,2,12,6.48,2,12,2h0Z" fill-rule="evenodd"/>'}};k["open-link"]=k.external;k.plus=k.add;k.bell=k.notification;const cr='<linearGradient id="cgo-brand-grad" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="var(--brand-gradient-start-appname)"/><stop offset="100%" stop-color="var(--brand-gradient-end-appname)"/></linearGradient>',lr={addone:[0],"bar-chart":[0],delete:[1],download:[0],edit:[0],"export-svg":[0],"horizontal-flip":[1],"vertical-flip":[1],layer:[0],link:[1],login:[0],logout:[0],menu:[2],notification:[0],plugin:[4],sort:[2],sparkle:[0],train:[0,1],unlock:[0],"vi-clss":[0],"vi-line":[0],"vi-nbr":[1],"vi-stn":[2],"vi-sub":[0],"vi-text":[0],"vi-way":[1],"view-list":[0,1],design:[1,2],eye:[1],window:[2],"vi-oth":[2,3,4],preset:[1],time:[1]};function dr(r){return r.match(/<(path|circle|rect|polygon|ellipse|line|polyline)[^>]*\/>/g)||[r]}function hr(r,e){return r.replace(/\/>$/,' fill="'+e+'"/>')}function T(r){return String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Mt(r,e={}){const t=k[r];if(!t)return console.warn('[CGO.icon] 未找到图标："'+r+'"'),"";const o=e.size!==void 0?e.size:24,i=typeof o=="number"?o+"px":o,a=t.type==="stroke",n="cgo-svg-icon"+(a?" cgo-stroke-icon":"")+(e.class?" "+e.class:""),c=e.ariaHidden!==!1?' aria-hidden="true"':"",s=e.title?"<title>"+T(e.title)+"</title>":"",p=e.colorMode||(e.color?"fixed":"auto"),f=lr[r]||[],l=f.length>0;if(p==="brand"&&l){let h=s+"<defs>"+cr+"</defs>";const u=dr(t.d),x=a?"none":"var(--icon-clr, currentColor)";for(let y=0;y<u.length;y++){const $=f.includes(y)?"url(#cgo-brand-grad)":x;h+=hr(u[y],$)}return'<svg class="'+n+'" xmlns="http://www.w3.org/2000/svg" viewBox="'+(t.viewBox||"0 0 24 24")+'" width="'+i+'" height="'+i+'"'+(a?' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"':"")+c+">"+h+"</svg>"}let g=a?"none":"currentColor";return e.color&&(g=e.color),'<svg class="'+n+'" xmlns="http://www.w3.org/2000/svg" viewBox="'+(t.viewBox||"0 0 24 24")+'" width="'+i+'" height="'+i+'" fill="'+g+'"'+(a?' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"':"")+c+">"+s+t.d+"</svg>"}function pr(){return Object.keys(k)}class me extends b{constructor(){super(),this.name="",this.size="",this.color="",this.colorMode=""}updated(e){if(e.has("size")){const t=this.size?isNaN(this.size)?this.size:`${this.size}px`:"";t?(this.style.setProperty("--cgo-icon-size",t),this.style.width=t,this.style.height=t):(this.style.removeProperty("--cgo-icon-size"),this.style.width="",this.style.height="")}}render(){if(!k[this.name])return d``;const t=Mt(this.name,{size:this.size||void 0,color:this.color||void 0,colorMode:this.colorMode||void 0});if(!t)return d``;const o=document.createElement("template");return o.innerHTML=t,d`
            ${o.content.cloneNode(!0)}
        `}}v(me,"properties",{name:{type:String},size:{type:String},color:{type:String},colorMode:{type:String,attribute:"color-mode"}}),v(me,"styles",m`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            line-height: 1;
            vertical-align: middle;
            color: inherit;
        }
        svg {
            display: block;
            width: var(--cgo-icon-size, 20px);
            height: var(--cgo-icon-size, 20px);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-icon")||customElements.define("cgo-icon",me));class xe extends b{constructor(){super(),this.variant="info",this.size="",this.icon="",this.iconPos="left",this.disabled=!1,this.loading=!1,this.full=!1,this.iconOnly=!1,this.pill=!1,this.active=!1,this.type="button",this.color="",this.textColor="",this.iconColor=""}render(){const t=`v-${this.color?"custom":this.variant} ${this.size?"s-"+this.size:""} ${this.active?"is-active":""}`,o=this.color?`--cgo-button-bg:${this.color};--cgo-button-border:${this.color};--cgo-button-fg:${this.textColor||"var(--btn-text, #fff)"};`:"",i=this.icon?d`
                  <cgo-icon name=${this.icon} size="18" color=${this.iconColor||""}></cgo-icon>
              `:null,a=d`
            <slot></slot>
        `;return d`
            <button class=${t} style=${o} type=${this.type} ?disabled=${this.disabled||this.loading}>
                ${this.loading?d`
                          <span class="spin"></span>
                      `:null}
                ${!this.loading&&this.iconPos!=="right"?i:null} ${this.iconOnly?null:a}
                ${!this.loading&&this.iconPos==="right"?i:null}
            </button>
        `}}v(xe,"properties",{variant:{type:String},size:{type:String},icon:{type:String},iconPos:{type:String,attribute:"icon-pos"},disabled:{type:Boolean,reflect:!0},loading:{type:Boolean,reflect:!0},full:{type:Boolean,reflect:!0},iconOnly:{type:Boolean,attribute:"icon-only",reflect:!0},pill:{type:Boolean,reflect:!0},active:{type:Boolean,reflect:!0},type:{type:String},color:{type:String},textColor:{type:String,attribute:"text-color"},iconColor:{type:String,attribute:"icon-color"}}),v(xe,"styles",m`
        :host {
            display: inline-flex;
            vertical-align: middle;
        }
        :host([full]) {
            display: flex;
            width: 100%;
        }
        button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 6px 12px;
            border-radius: var(--radius-xs, 4px);
            border: 1px solid transparent;
            cursor: pointer;
            font-family: var(--font-sans, system-ui, sans-serif);
            font-size: var(--text-md, 0.9rem);
            font-weight: 500;
            line-height: 1;
            height: 34px;
            box-sizing: border-box;
            width: 100%;
            white-space: nowrap;
            transition: all var(--transition-base, 0.2s ease);
            user-select: none;
        }
        button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 96, 152, 0.3);
        }
        :host([disabled]) button,
        :host([loading]) button {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* 变体 */
        .v-primary {
            background: var(--primary-color, #006098);
            color: var(--btn-text, #fff);
            border-color: var(--primary-color, #006098);
        }
        .v-primary:hover {
            background: var(--primary-hover, #004f80);
            border-color: var(--primary-hover, #004f80);
        }
        .v-primary.is-active {
            background: var(--primary-hover, #004f80);
            border-color: var(--primary-hover, #004f80);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .v-info {
            background: var(--btn-info-bg, #f1f3f5);
            color: var(--btn-info-text, #333);
            border-color: var(--border-color, #dee2e6);
        }
        .v-info:hover {
            background: var(--btn-info-hover, #e9ecef);
            color: var(--text-main, #00263b);
        }
        .v-dark {
            background: var(--cgo-btn-dark-bg, #131313);
            color: #dee2e6;
            border-color: var(--cgo-btn-dark-border, var(--cgo-btn-dark-bg, #333333));
        }
        .v-dark:hover {
            background: var(--cgo-btn-dark-hover-bg, #1a1a1a);
            border-color: var(--cgo-btn-dark-hover-border, var(--cgo-btn-dark-hover-bg, #333333));
        }
        .v-danger {
            background: var(--danger-color, #ea4335);
            color: #fff;
            border-color: var(--danger-color, #ea4335);
        }
        .v-danger:hover {
            background: var(--danger-hover, #ff5252);
            border-color: var(--danger-hover, #ff5252);
        }
        .v-success {
            background: var(--success-color, #34a853);
            color: #fff;
            border-color: var(--success-color, #34a853);
        }
        .v-success:hover {
            filter: brightness(1.1);
        }
        .v-warning,
        .v-warn {
            background: var(--warning-color, #f59e0b);
            color: #fff;
            border-color: var(--warning-color, #f59e0b);
        }
        .v-warning:hover,
        .v-warn:hover {
            filter: brightness(1.08);
        }
        .v-ghost {
            background: transparent;
            color: var(--primary-color, #006098);
            border-color: var(--primary-color, #006098);
        }
        .v-ghost:hover {
            background: var(--info-bg, #e7f3fb);
        }
        .v-custom {
            background: var(--cgo-button-bg);
            color: var(--cgo-button-fg, var(--btn-text, #fff));
            border-color: var(--cgo-button-border, var(--cgo-button-bg));
        }
        .v-custom:hover {
            filter: brightness(1.06);
        }

        /* 尺寸 */
        .s-sm {
            padding: 4px 10px;
            font-size: var(--text-sm, 12px);
            height: 28px;
        }
        .s-lg {
            padding: 10px 20px;
            font-size: 1rem;
            height: 44px;
        }
        .s-xl {
            padding: 14px 28px;
            font-size: 1.05rem;
            height: 52px;
        }

        /* 纯图标 */
        :host([icon-only]) button {
            width: 34px;
            height: 34px;
            padding: 0;
        }
        :host([icon-only]) .s-sm {
            width: 28px;
            height: 28px;
        }
        :host([icon-only]) .s-lg {
            width: 44px;
            height: 44px;
        }

        /* 胶囊形（筛选 / 控制栏 ctrl-btn）*/
        :host([pill]) button {
            height: 36px;
            padding: 0 20px;
            border-radius: var(--radius-full, 9999px);
            background: var(--btn-info-bg, #f1f3f5);
            border: 1px solid var(--border-color, #dee2e6);
            color: var(--text-main, #00263b);
            font-weight: 500;
        }
        :host([pill]) button:hover {
            background: var(--btn-info-hover, #e9ecef);
        }
        :host([pill]) button.is-active,
        :host([pill]) button.v-primary {
            background: var(--primary-color, #006098);
            border-color: var(--primary-color, #006098);
            color: var(--btn-text, #fff);
        }
        :host([pill]) button.is-active:hover,
        :host([pill]) button.v-primary:hover {
            background: var(--primary-hover, #004f80);
            border-color: var(--primary-hover, #004f80);
        }
        :host([pill]) .s-sm {
            height: 30px;
            padding: 0 14px;
        }

        .spin {
            width: 1.1em;
            height: 1.1em;
            border: 2px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: cgo-spin 0.7s linear infinite;
        }
        @keyframes cgo-spin {
            to {
                transform: rotate(360deg);
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-button")||customElements.define("cgo-button",xe));class ye extends b{constructor(){super(),this.variant="primary",this.subsystem="",this.pill=!1}render(){if(this.subsystem){const e=`background:var(--brand-gradient-${this.subsystem});border:1px solid var(--brand-border-${this.subsystem});`;return d`
                <span class="badge brand" style=${e}><slot></slot></span>
            `}return d`
            <span class="badge ${this.variant}"><slot></slot></span>
        `}}v(ye,"properties",{variant:{type:String},subsystem:{type:String},pill:{type:Boolean,reflect:!0}}),v(ye,"styles",m`
        :host {
            display: inline-flex;
            vertical-align: middle;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 2px 8px;
            border-radius: var(--radius-full, 9999px);
            font-size: var(--text-xs, 11px);
            font-weight: 700;
            line-height: 1.4;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        .primary {
            background: var(--primary-color, #006098);
            color: #fff;
        }
        .success {
            background: var(--success-color, #34a853);
            color: #fff;
        }
        .danger {
            background: var(--danger-color, #ea4335);
            color: #fff;
        }
        .warning {
            background: var(--warning-color, #f59e0b);
            color: #fff;
        }
        .info {
            background: var(--info-bg, #e7f3fb);
            color: var(--info-color, #006098);
        }
        .muted {
            background: var(--btn-info-bg, #f1f3f5);
            color: var(--text-light, #636f75);
        }
        :host([pill]) .badge {
            padding: 6px 12px;
            border-radius: var(--radius-xl, 20px);
            font-weight: 700;
        }
        .brand {
            color: #fff;
            border-radius: var(--radius-xs, 4px);
            font-size: var(--text-sm, 12px);
            font-weight: 600;
            margin-left: 4px;
            vertical-align: middle;
        }
        :host([pill]) .brand {
            margin-left: 0;
            border-radius: var(--radius-xl, 20px);
            font-weight: 700;
            font-size: var(--text-md, 0.9rem);
            box-shadow: var(--shadow-xs, 0 1px 3px rgba(0, 0, 0, 0.08));
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-badge")||customElements.define("cgo-badge",ye));class we extends b{constructor(){super(),this.label="",this.value="",this.placeholder="",this.type="text",this.hint="",this.state="",this.disabled=!1}render(){return d`
            ${this.label?d`
                      <label>${this.label}</label>
                  `:null}
            <input
                .value=${this.value}
                type=${this.type}
                placeholder=${this.placeholder}
                ?disabled=${this.disabled}
                @input=${e=>{this.value=e.target.value,this.dispatchEvent(new CustomEvent("cgo-input",{detail:{value:this.value},bubbles:!0,composed:!0}))}}
            />
            ${this.hint?d`
                      <div class="hint ${this.state}">${this.hint}</div>
                  `:null}
        `}}v(we,"properties",{label:{type:String},value:{type:String},placeholder:{type:String},type:{type:String},hint:{type:String},state:{type:String},disabled:{type:Boolean,reflect:!0}}),v(we,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        label {
            display: block;
            margin-bottom: 6px;
            color: var(--text-main, #00263b);
            font-size: var(--text-sm, 12px);
            font-weight: 600;
        }
        input {
            width: 100%;
            height: 38px;
            padding: 8px 12px;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-sm, 6px);
            background: var(--card-bg, #fff);
            color: var(--text-main, #00263b);
            font: inherit;
            font-size: 14px;
            box-sizing: border-box;
            transition:
                border-color var(--transition-base, 0.2s ease),
                box-shadow var(--transition-base, 0.2s ease);
        }
        input::placeholder {
            color: transparent;
        }
        input:focus::placeholder {
            color: var(--text-light, #636f75);
            opacity: 0.65;
        }
        input:focus {
            outline: none;
            border-color: var(--primary-color, #00263b);
            box-shadow: 0 0 0 3px rgba(0, 29, 49, 0.12);
        }
        input:disabled {
            background: var(--btn-info-bg, #e9ecef);
            color: var(--text-light, #636f75);
            cursor: not-allowed;
        }
        .hint {
            margin-top: 5px;
            color: var(--text-light, #636f75);
            font-size: var(--text-sm, 12px);
            line-height: 1.45;
        }
        .hint.success {
            color: var(--success-color, #34a853);
        }
        .hint.danger {
            color: var(--danger-color, #ea4335);
        }
        .hint.info {
            color: var(--info-color, #006098);
            background: var(--info-bg, #e8f0fe);
            border: 1px solid var(--info-border, #b8d0ee);
            border-radius: var(--radius-xs, 4px);
            padding: 7px 10px;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-input")||customElements.define("cgo-input",we));class ke extends b{constructor(){super(),this.variant="standard",this.title=""}render(){return d`
            <section class="card ${this.variant}">
                ${this.title?d`
                          <h3>${this.title}</h3>
                      `:null}
                <div class="body"><slot></slot></div>
            </section>
        `}}v(ke,"properties",{variant:{type:String},title:{type:String}}),v(ke,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        .card {
            padding: 24px;
            border-radius: var(--radius-lg, 12px);
            background: var(--card-bg, #fff);
            color: var(--text-main, #00263b);
            border: 1px solid transparent;
            box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
            box-sizing: border-box;
        }
        .card:hover {
            box-shadow: var(--shadow-md, 0 4px 15px rgba(0, 0, 0, 0.08));
        }
        .glass {
            background: var(--glass-bg, rgba(255, 255, 255, 0.7));
            border-color: var(--glass-border, rgba(255, 255, 255, 0.4));
            box-shadow: 0 8px 32px var(--glass-shadow, rgba(0, 0, 0, 0.08));
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .info {
            color: #fff;
            border: none;
            background: linear-gradient(135deg, #00263b, #004060);
            box-shadow: 0 12px 30px rgba(0, 29, 49, 0.22);
        }
        .danger {
            border-color: var(--danger-border, #e58f8f);
            background: var(--danger-bg, #fff1f1);
        }
        h3 {
            margin: 0 0 8px;
            font-size: 18px;
            font-weight: 700;
        }
        .body {
            color: inherit;
            font-size: 14px;
            line-height: 1.65;
        }
        .standard .body,
        .glass .body,
        .danger .body {
            color: var(--text-light, #666);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-card")||customElements.define("cgo-card",ke));class Et extends b{render(){return d`
            <slot></slot>
        `}}v(Et,"styles",m`
        :host {
            display: block;
            overflow-x: auto;
            border-radius: var(--radius-md, 8px);
            border: 1px solid var(--border-color, #dee2e6);
        }
        ::slotted(table) {
            width: 100%;
            border-collapse: collapse;
            font-family: var(--font-sans, system-ui, sans-serif);
            font-size: 13px;
            color: var(--text-main, #00263b);
        }
        ::slotted(table th) {
            text-align: left;
            padding: 10px 12px;
            background: var(--table-head-bg, #f1f3f5);
            color: var(--table-head-text, #00263b);
            font-weight: 600;
        }
        ::slotted(table td) {
            padding: 10px 12px;
            border-top: 1px solid var(--table-cell-border, #eee);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-table")||customElements.define("cgo-table",Et));class $e extends b{constructor(){super(),this.label="图片/媒体预览区域 (自适应背景网格点)"}render(){return d`
            <div class="viewer">
                <div class="display"><slot>${this.label}</slot></div>
                <div class="actions"><slot name="actions"></slot></div>
            </div>
        `}}v($e,"properties",{label:{type:String}}),v($e,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        .viewer {
            overflow: hidden;
            border-radius: var(--radius-lg, 12px);
            border: 1px solid var(--border-color, #dee2e6);
            background: var(--card-bg, #fff);
            box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
        }
        .display {
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background-image: radial-gradient(var(--border-color, #dee2e6) 1px, transparent 1px);
            background-size: 16px 16px;
            color: var(--text-light, #666);
            font-size: 13px;
            text-align: center;
        }
        .actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px;
            border-top: 1px solid var(--border-color, #dee2e6);
            background: var(--card-bg, #fff);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-media-viewer")||customElements.define("cgo-media-viewer",$e));class _e extends b{constructor(){super(),this.title="浮动控制面板",this.snapped=!1,this.minimized=!1,this.closed=!1,this.interactive=!0,this.noclose=!1,this.lockx=!1,this.resetOnDragend=!1,this._onPointerDown=this._onPointerDown.bind(this),this._toggleMinimize=this._toggleMinimize.bind(this),this._close=this._close.bind(this)}_onPointerDown(e){if(!this.interactive||e.button!==0||e.target.closest(".controls"))return;const t=this.getBoundingClientRect(),o=window.getComputedStyle(this),a=(this.offsetParent||document.body).getBoundingClientRect();let n=t.left-a.left,c=t.top-a.top;o.position!=="absolute"&&o.position!=="fixed"&&(this.style.position="absolute",this.style.zIndex="1000",this.style.left=`${n}px`,this.style.top=`${c}px`,this.style.margin="0"),this._x=parseFloat(this.style.left),isNaN(this._x)&&(this._x=n),this._y=parseFloat(this.style.top),isNaN(this._y)&&(this._y=c),this._startX=e.clientX,this._startY=e.clientY,this._isDragging=!0,this._dragHeader=e.currentTarget;try{this._dragHeader&&this._dragHeader.setPointerCapture&&(this._dragHeader.setPointerCapture(e.pointerId),this._pointerId=e.pointerId)}catch{}this._onPointerMoveBound=this._onPointerMove.bind(this),this._onPointerUpBound=this._onPointerUp.bind(this),document.addEventListener("pointermove",this._onPointerMoveBound),document.addEventListener("pointerup",this._onPointerUpBound),this.dispatchEvent(new CustomEvent("cgo-dragstart",{bubbles:!0,composed:!0})),e.preventDefault()}_onPointerMove(e){if(!this._isDragging)return;const t=e.clientX-this._startX,o=e.clientY-this._startY;let i=this._x+t,a=this._y+o;if(this.offsetParent){const n=this.offsetParent.getBoundingClientRect(),c=this.getBoundingClientRect(),s=Math.max(0,n.width-c.width),p=Math.max(0,n.height-c.height);i=Math.max(0,Math.min(i,s)),a=Math.max(0,Math.min(a,p));const f=12;let l=!1;i<f?(i=0,l=!0):i>s-f&&(i=s,l=!0),a<f?(a=0,l=!0):a>p-f&&(a=p,l=!0),this.snapped=l}this.lockx&&(i=this._x),this.style.left=`${i}px`,this.style.top=`${a}px`,this.dispatchEvent(new CustomEvent("cgo-drag",{detail:{x:i,y:a,clientX:e.clientX,clientY:e.clientY,snapped:this.snapped},bubbles:!0,composed:!0}))}_onPointerUp(e){if(!this._isDragging)return;if(this._isDragging=!1,this._pointerId!==void 0&&this._dragHeader&&this._dragHeader.releasePointerCapture){try{this._dragHeader.releasePointerCapture(this._pointerId)}catch{}this._pointerId=void 0}document.removeEventListener("pointermove",this._onPointerMoveBound),document.removeEventListener("pointerup",this._onPointerUpBound);const t=e&&e.clientX!==void 0?e.clientX:0,o=e&&e.clientY!==void 0?e.clientY:0,i=parseFloat(this.style.left),a=parseFloat(this.style.top);isNaN(i)||(this._x=i),isNaN(a)||(this._y=a),(this.resetOnDragend||this.lockx)&&(this.style.left="",this.style.top=""),this.dispatchEvent(new CustomEvent("cgo-dragend",{detail:{clientX:t,clientY:o},bubbles:!0,composed:!0}))}_toggleMinimize(){this.minimized=!this.minimized,this.dispatchEvent(new CustomEvent("cgo-minimize",{detail:{minimized:this.minimized},bubbles:!0,composed:!0}))}_close(){this.closed=!0,this.dispatchEvent(new CustomEvent("cgo-close",{bubbles:!0,composed:!0}))}render(){return d`
            <section class="window">
                <div class="header" part="header" @pointerdown=${this._onPointerDown}>
                    <div class="title-wrapper">
                        <div class="title">${this.title}</div>
                        <slot name="title-extra"></slot>
                    </div>
                    <div class="controls">
                        <slot name="header-extra"></slot>
                        <button class="ctrl" title=${this.minimized?"还原":"最小化"} @click=${this._toggleMinimize}>
                            ${this.minimized?"+":"-"}
                        </button>
                        ${this.noclose?"":d`<button class="ctrl" title="关闭" @click=${this._close}><cgo-icon name="close" size="12"></cgo-icon></button>`}
                    </div>
                </div>
                <div class="content" part="content"><slot></slot></div>
            </section>
        `}}v(_e,"properties",{title:{type:String},snapped:{type:Boolean,reflect:!0},minimized:{type:Boolean,reflect:!0},closed:{type:Boolean,reflect:!0},interactive:{type:Boolean,reflect:!0},noclose:{type:Boolean,reflect:!0},lockx:{type:Boolean,reflect:!0},resetOnDragend:{type:Boolean,attribute:"reset-on-dragend",reflect:!0}}),v(_e,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        :host([closed]) {
            display: none !important;
        }
        :host([minimized]) .content {
            display: none;
        }
        :host([interactive]) .header {
            cursor: move;
            user-select: none;
        }
        .window {
            width: min(320px, 100%);
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-lg, 12px);
            background: var(--panel-bg, #fff);
            box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.12));
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100%;
            box-sizing: border-box;
        }
        :host([snapped]) .window {
            border-color: var(--primary-color, #00263b);
            box-shadow:
                0 0 0 3px rgba(0, 29, 49, 0.12),
                var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.12));
        }
        .header {
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px 0 14px;
            border-bottom: 1px solid var(--border-color, #dee2e6);
            background: var(--card-bg, #fff);
            flex-shrink: 0;
        }
        .title-wrapper {
            display: flex;
            align-items: center;
            gap: 6px;
            overflow: hidden;
            min-width: 0;
            margin-right: 8px;
        }
        .title {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-main, #00263b);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .controls {
            display: flex;
            gap: 4px;
            color: var(--text-light, #666);
            flex-shrink: 0;
        }
        .ctrl {
            width: 22px;
            height: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-xs, 4px);
            background: transparent;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
        }
        .ctrl:hover {
            background: var(--btn-info-hover, #e9ecef);
            color: var(--text-main, #00263b);
        }
        .content {
            padding: var(--cgo-floating-content-padding, 14px);
            color: var(--text-light, #666);
            font-size: 13px;
            line-height: 1.55;
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-floating-window")||customElements.define("cgo-floating-window",_e));class Me extends b{constructor(){super(),this.state="inherit",this.label="",this.open=!1,this._onOutside=this._onOutside.bind(this)}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onOutside)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onOutside)}_onOutside(e){this.contains(e.target)||(this.open=!1)}_options(){return[{state:"inherit",label:"继承权限"},{state:"enabled",label:"允许访问"},{state:"disabled",label:"拒绝访问"},{state:"hidden",label:"隐藏入口"}]}_current(){return this._options().find(e=>e.state===this.state)||this._options()[0]}_select(e){this.state=e.state,this.label=e.label,this.open=!1,this.dispatchEvent(new CustomEvent("cgo-admin-change",{detail:e,bubbles:!0,composed:!0}))}render(){const e=this.label?{state:this.state,label:this.label}:this._current();return d`
            <button
                class="select"
                type="button"
                @click=${t=>{t.stopPropagation(),this.open=!this.open}}
            >
                <span class="dot"></span>
                <span class="label">${e.label}</span>
                <cgo-icon class="arrow" name="chevron-down" size="18" aria-hidden="true"></cgo-icon>
            </button>
            <div class="menu">
                ${this._options().map(t=>d`
                        <button
                            class="option ${t.state}"
                            type="button"
                            aria-selected=${t.state===this.state}
                            @click=${()=>this._select(t)}
                        >
                            <span class="dot"></span>
                            ${t.label==="继承权限"?"继承 (Inherit)":t.label==="允许访问"?"允许 (Allow)":t.label==="拒绝访问"?"拒绝 (Deny)":"隐藏 (Hide)"}
                        </button>
                    `)}
            </div>
        `}}v(Me,"properties",{state:{type:String,reflect:!0},label:{type:String},open:{type:Boolean,reflect:!0}}),v(Me,"styles",m`
        :host {
            display: inline-block;
            position: relative;
            min-width: 136px;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        .select {
            display: grid;
            grid-template-columns: 9px minmax(0, 1fr) 18px;
            align-items: center;
            gap: 8px;
            width: 100%;
            height: 34px;
            padding: 0 10px;
            border-radius: var(--radius-xs, 4px);
            border: 1px solid var(--permission-inherit-border, #d2dbe6);
            background: var(--permission-inherit-soft, #f2f5f8);
            color: var(--text-main, #00263b);
            box-sizing: border-box;
            font-size: 13px;
            font-weight: 700;
            text-align: left;
            cursor: pointer;
            font-family: var(--font-sans, system-ui, sans-serif);
            transition:
                border-color var(--transition-base, 0.2s ease),
                background var(--transition-base, 0.2s ease),
                box-shadow var(--transition-base, 0.2s ease);
        }
        .select:hover {
            border-color: var(--permission-inherit, #64748b);
        }
        .label {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: var(--permission-inherit, #64748b);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--permission-inherit, #64748b) 14%, transparent);
            flex-shrink: 0;
        }
        :host([state='enabled']) .select {
            border-color: var(--permission-enabled-border, #badfc8);
            background: var(--permission-enabled-soft, #edf8f1);
        }
        :host([state='enabled']) .select:hover {
            border-color: var(--permission-enabled, #16803d);
        }
        :host([state='enabled']) .dot {
            background: var(--permission-enabled, #16803d);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--permission-enabled, #16803d) 14%, transparent);
        }
        :host([state='disabled']) .select {
            border-color: var(--permission-disabled-border, #b9c5d4);
            background: var(--permission-disabled-soft, #f0f4f8);
        }
        :host([state='disabled']) .select:hover {
            border-color: var(--permission-disabled, #52637a);
        }
        :host([state='disabled']) .dot {
            background: var(--permission-disabled, #52637a);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--permission-disabled, #52637a) 14%, transparent);
        }
        :host([state='hidden']) .select {
            border-color: var(--permission-hidden-border, #e58f8f);
            background: var(--permission-hidden-soft, #fff1f1);
        }
        :host([state='hidden']) .select:hover {
            border-color: var(--permission-hidden, #c62828);
        }
        :host([state='hidden']) .dot {
            background: var(--permission-hidden, #c62828);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--permission-hidden, #c62828) 14%, transparent);
        }
        .arrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--text-main, #00263b);
            transition: transform var(--transition-base, 0.2s ease);
            flex-shrink: 0;
        }
        :host([open]) .arrow {
            transform: rotate(180deg);
        }
        .menu {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            right: 0;
            z-index: 600;
            padding: 6px;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-sm, 6px);
            background: var(--card-bg, #fff);
            box-shadow: var(--shadow-xl, 0 18px 46px rgba(16, 32, 51, 0.16));
            display: none;
        }
        :host([open]) .menu {
            display: block;
        }
        .option {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            border: 0;
            border-radius: var(--radius-xs, 4px);
            background: transparent;
            color: var(--text-main, #00263b);
            padding: 8px 9px;
            font: inherit;
            font-size: 12px;
            font-weight: 700;
            text-align: left;
            cursor: pointer;
        }
        .option:hover,
        .option[aria-selected='true'] {
            background: var(--btn-info-hover, #e9ecef);
        }
        .option.enabled[aria-selected='true'] {
            background: var(--permission-enabled-soft, #edf8f1);
            color: var(--permission-enabled, #16803d);
        }
        .option.hidden[aria-selected='true'] {
            background: var(--permission-hidden-soft, #fff1f1);
            color: var(--permission-hidden, #c62828);
        }
        .option .dot {
            width: 8px;
            height: 8px;
            box-shadow: none;
        }
        .option.inherit .dot {
            background: var(--permission-inherit, #64748b);
        }
        .option.enabled .dot {
            background: var(--permission-enabled, #16803d);
        }
        .option.disabled .dot {
            background: var(--permission-disabled, #52637a);
        }
        .option.hidden .dot {
            background: var(--permission-hidden, #c62828);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-admin-select")||customElements.define("cgo-admin-select",Me));class Ee extends b{constructor(){super(),this.icon="⚙️",this.name="项目",this.title="项目选项",this.detail="选项详细信息",this.action="配置"}render(){return d`
            <div class="item">
                <div class="left">
                    <span class="icon">${this.icon}</span>
                    <span class="name">${this.name}</span>
                </div>
                <div class="middle">
                    <span class="title">${this.title}</span>
                    <span class="detail">${this.detail}</span>
                </div>
                <button
                    class="action"
                    type="button"
                    @click=${()=>this.dispatchEvent(new CustomEvent("cgo-preference-action",{bubbles:!0,composed:!0}))}
                >
                    ${this.action}
                </button>
            </div>
        `}}v(Ee,"properties",{icon:{type:String},name:{type:String},title:{type:String},detail:{type:String},action:{type:String}}),v(Ee,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        .item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 14px 20px;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: 8px;
            background: var(--panel-bg, #fff);
            color: var(--text-main, #00263b);
            box-sizing: border-box;
            transition: background-color var(--transition-base, 0.2s ease);
        }
        .item:hover {
            background: var(--btn-info-bg, #e9ecef);
        }
        .left {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 180px;
            min-width: 0;
            flex-shrink: 0;
        }
        .icon {
            width: 26px;
            height: 26px;
            border-radius: var(--radius-xs, 4px);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: var(--btn-info-bg, #e9ecef);
            font-size: 16px;
            flex-shrink: 0;
        }
        .name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 0.9rem;
            font-weight: 600;
            line-height: 1.3;
            color: var(--text-main, #00263b);
        }
        .title {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 0.95rem;
            font-weight: 500;
            line-height: 1.3;
            color: var(--text-main, #00263b);
        }
        .detail {
            color: var(--text-light, #666);
            font-size: 0.88rem;
            line-height: 1.35;
            overflow-wrap: anywhere;
        }
        .middle {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            min-width: 0;
            padding-right: 20px;
        }
        .action {
            min-width: 64px;
            height: 34px;
            padding: 0 14px;
            border-radius: var(--radius-xs, 4px);
            border: 1px solid var(--primary-color, #00263b);
            background: var(--card-bg, #fff);
            color: var(--primary-color, #00263b);
            font: inherit;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            flex-shrink: 0;
        }
        .action:hover {
            background: var(--primary-color, #00263b);
            color: #fff;
        }
        @media (max-width: 720px) {
            .item {
                flex-wrap: wrap;
                align-items: flex-start;
            }
            .left {
                width: 100%;
            }
            .middle {
                width: 100%;
                flex-basis: 100%;
                padding-right: 0;
            }
            .action {
                width: max-content;
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-preference-item")||customElements.define("cgo-preference-item",Ee));const vr=new Map([["7","dark"],["9","dark"],["13","dark"],["14","dark"],["19","dark"],["22","dark"],["27","dark"],["cae","dark"]]);class Se extends b{constructor(){super(),this.line="1"}_token(){const e=String(this.line||"").toLowerCase();return{亦庄:"24",亦庄线:"24",亦庄t1:"t1",t1:"t1",房山:"25",房山线:"25",燕房:"25w",燕房线:"25w",昌平:"27",昌平线:"27",西郊:"xj",西郊线:"xj",首都机场:"cae",大兴机场:"dae",s1:"sub-s1",s2:"sub-s2",s5:"sub-s5",s6:"sub-s6"}[e]||e}render(){const e=this._token(),t=vr.has(e)?"var(--line-color-text-dark, #00263b)":"var(--line-color-text-light, #fff)",o=`--line-bg:var(--line-color-${e});--line-fg:${t}`;return d`
            <span class="chip" style=${o}><slot>${this.line}号线</slot></span>
        `}}v(Se,"properties",{line:{type:String}}),v(Se,"styles",m`
        :host {
            display: inline-flex;
            vertical-align: middle;
        }
        .chip {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 44px;
            height: 24px;
            padding: 0 14px;
            border-radius: var(--radius-full, 9999px);
            background: var(--line-bg, var(--primary-color, #00263b));
            color: var(--line-fg, #fff);
            font-family: var(--font-sans, system-ui, sans-serif);
            font-size: 12px;
            font-weight: 700;
            line-height: 1;
            white-space: nowrap;
            box-sizing: border-box;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-line-badge")||customElements.define("cgo-line-badge",Se));class Ze extends b{constructor(){super(),this.level="default",this.label=""}_label(){return this.label?this.label:{default:"常旅客",test:"先锋旅客",prime:"启元旅客",admin:"管理员"}[this.level]||"常旅客"}render(){return d`
            <section class="card"><span class="tag">${this._label()}</span></section>
        `}}v(Ze,"properties",{level:{type:String,reflect:!0},label:{type:String}}),v(Ze,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        .card {
            position: relative;
            box-sizing: border-box;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            min-height: 96px;
            padding: 24px 30px;
            border-radius: var(--radius-lg, 12px);
            overflow: hidden;
            color: #fff;
            background: var(--level-default-gradient, linear-gradient(135deg, #009655, #43b581));
            box-shadow: 0 8px 32px rgba(0, 150, 85, 0.18);
            color-scheme: only light;
            forced-color-adjust: none;
        }
        :host([level='test']) .card {
            background: var(--level-test-gradient, linear-gradient(135deg, #e98913, #f0b14a));
            box-shadow: 0 8px 32px rgba(233, 137, 19, 0.22);
        }
        :host([level='prime']) .card {
            background: var(--level-prime-gradient, linear-gradient(135deg, #5f1985, #9a56c8));
            box-shadow: 0 8px 32px rgba(95, 25, 133, 0.25);
        }
        :host([level='admin']) .card {
            background: var(--level-admin-gradient, linear-gradient(135deg, #5c1c24, #9b3846));
            box-shadow: 0 8px 32px rgba(92, 28, 36, 0.25);
        }
        .tag {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 12px;
            border-radius: var(--radius-xl, 20px);
            background: rgba(255, 255, 255, 0.22);
            color: #fff;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            font-size: var(--text-md, 0.9rem);
            font-weight: 700;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-level-card")||customElements.define("cgo-level-card",Ze));class Ae extends b{constructor(){super(),this.mode="spinner",this.size="",this.speed="medium",this.direction="cw",this.fillMode="fill",this.value=0,this.duration="",this.showText=!1,this.showPercentage=!1,this._animTimer=null,this._startTime=null}connectedCallback(){super.connectedCallback(),this.duration&&this._checkAutoStartDuration()}disconnectedCallback(){super.disconnectedCallback(),this._stopDurationAnim()}updated(e){e.has("duration")&&this.duration&&this._checkAutoStartDuration()}_checkAutoStartDuration(){const e=this._parseDurationMs(this.duration);e>0&&this.start(e)}_parseDurationMs(e){if(typeof e=="number")return e;if(!e)return 0;const t=String(e).trim();return t.endsWith("ms")?parseFloat(t)||0:t.endsWith("s")?(parseFloat(t)||0)*1e3:parseFloat(t)||0}start(e){const t=e?this._parseDurationMs(e):this._parseDurationMs(this.duration);if(t<=0)return;this._stopDurationAnim(),this.value=0;const o=performance.now(),i=a=>{const n=a-o,c=Math.min(1,n/t);this.value=Math.round(c*100),this.dispatchEvent(new CustomEvent("cgo-progress-change",{detail:{value:this.value},bubbles:!0,composed:!0})),c<1?this._animTimer=requestAnimationFrame(i):(this._animTimer=null,this.dispatchEvent(new CustomEvent("cgo-progress-complete",{detail:{value:this.value},bubbles:!0,composed:!0})))};this._animTimer=requestAnimationFrame(i)}_stopDurationAnim(){this._animTimer&&(cancelAnimationFrame(this._animTimer),this._animTimer=null)}reset(){this._stopDurationAnim(),this.value=0}setValue(e){this._stopDurationAnim(),this.value=e}_getNormalizedMode(){return this.mode==="progress"||this.hasAttribute("value")||this.hasAttribute("duration")?"progress":"spinner"}_getNormalizedSpeed(){const e=(this.speed||"").toLowerCase();return e==="slow"||e==="slow速"||e==="慢"?"2s":e==="fast"||e==="fast速"||e==="快"?"0.5s":"1s"}_getNormalizedDirection(){const e=(this.direction||"").toLowerCase();return e==="ccw"||e==="counterclockwise"||e==="counter-clockwise"||e==="逆时针"?"ccw":"cw"}_getNormalizedFillMode(){const e=(this.fillMode||"").toLowerCase();return e==="clear"||e==="清空"?"clear":"fill"}_getNormalizedValue(){let e=parseFloat(this.value);return isNaN(e)&&(e=0),e>0&&e<=1&&(e=e*100),Math.min(100,Math.max(0,e))}_shouldShowText(){return this.showText||this.showPercentage||this.hasAttribute("show-text")||this.hasAttribute("show-percentage")}render(){const e=this._getNormalizedMode(),t=this._getNormalizedDirection(),o=["sm","lg"].includes(this.size)?this.size:"",i=this.size&&!["sm","lg"].includes(this.size)?`width: ${typeof this.size=="number"||!isNaN(this.size)?`${this.size}px`:this.size}; height: ${typeof this.size=="number"||!isNaN(this.size)?`${this.size}px`:this.size};`:"",a=16,n=2*Math.PI*a;if(e==="spinner"){const u=this._getNormalizedSpeed(),x=t==="ccw"?"spin-ccw":"spin-cw",y=`${n*.25} ${n*.75}`;return d`
                <div class="spinner-container ${o}" style="${i}">
                    <svg viewBox="0 0 40 40">
                        <circle class="track" cx="20" cy="20" r="${a}"></circle>
                        <circle
                            class="indicator ${x}"
                            cx="20"
                            cy="20"
                            r="${a}"
                            stroke-dasharray="${y}"
                            style="--spin-duration: ${u};"
                        ></circle>
                    </svg>
                </div>
            `}const c=this._getNormalizedFillMode(),s=this._getNormalizedValue(),p=s/100;let f;c==="fill"?f=p:f=1-p;const l=n*(1-f),g=t==="ccw"?"dir-ccw":"dir-cw",h=this._animTimer?"0.05s":"0.3s";return d`
            <div class="spinner-container ${o}" style="${i}">
                <svg viewBox="0 0 40 40">
                    <circle class="track" cx="20" cy="20" r="${a}"></circle>
                    <circle
                        class="indicator progress-indicator ${g}"
                        cx="20"
                        cy="20"
                        r="${a}"
                        stroke-dasharray="${n}"
                        stroke-dashoffset="${l}"
                        style="--dash-transition: ${h};"
                    ></circle>
                </svg>
                ${this._shouldShowText()?d`<span class="progress-text">${Math.round(s)}%</span>`:""}
            </div>
        `}}v(Ae,"properties",{mode:{type:String},size:{type:String},speed:{type:String},direction:{type:String},fillMode:{type:String,attribute:"fill-mode"},value:{type:Number},duration:{type:String},showText:{type:Boolean,attribute:"show-text"},showPercentage:{type:Boolean,attribute:"show-percentage"}}),v(Ae,"styles",m`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            vertical-align: middle;
        }

        .spinner-container {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
        }

        .spinner-container.sm {
            width: 20px;
            height: 20px;
        }

        .spinner-container.lg {
            width: 60px;
            height: 60px;
        }

        svg {
            width: 100%;
            height: 100%;
            overflow: visible;
        }

        /* 背景轨道 */
        .track {
            fill: none;
            stroke: var(--border-color, #dee2e6);
            opacity: 0.4;
            stroke-width: 3.5;
        }

        .sm .track, .sm .indicator {
            stroke-width: 3;
        }

        .lg .track, .lg .indicator {
            stroke-width: 4;
        }

        /* 旋转指示器与进度指示器 */
        .indicator {
            fill: none;
            stroke: var(--primary-color, #006098);
            stroke-width: 3.5;
            stroke-linecap: round;
            transform-origin: 20px 20px;
        }

        /* Spinner 旋转动画 */
        .spin-cw {
            animation: spin-cw-anim var(--spin-duration, 1s) linear infinite;
        }

        .spin-ccw {
            animation: spin-ccw-anim var(--spin-duration, 1s) linear infinite;
        }

        @keyframes spin-cw-anim {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        @keyframes spin-ccw-anim {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(-360deg);
            }
        }

        /* 进度圆环样式与方向 */
        .progress-indicator {
            transition: stroke-dashoffset var(--dash-transition, 0.3s) ease;
        }

        .dir-cw {
            transform: rotate(-90deg);
        }

        .dir-ccw {
            transform: rotate(-90deg) scaleY(-1);
        }

        /* 百分比数字 */
        .progress-text {
            position: absolute;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-color, #212529);
            user-select: none;
            text-align: center;
            line-height: 1;
        }

        .sm .progress-text {
            font-size: 7px;
        }

        .lg .progress-text {
            font-size: 14px;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-spinner")||customElements.define("cgo-spinner",Ae));/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const St={CHILD:2},Zt=r=>(...e)=>({_$litDirective$:r,values:e});let At=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,o){this._$Ct=e,this._$AM=t,this._$Ci=o}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{I:fr}=nr,lt=r=>r,dt=()=>document.createComment(""),D=(r,e,t)=>{var a;const o=r._$AA.parentNode,i=e===void 0?r._$AB:e._$AA;if(t===void 0){const n=o.insertBefore(dt(),i),c=o.insertBefore(dt(),i);t=new fr(n,c,r,r.options)}else{const n=t._$AB.nextSibling,c=t._$AM,s=c!==r;if(s){let p;(a=t._$AQ)==null||a.call(t,r),t._$AM=r,t._$AP!==void 0&&(p=r._$AU)!==c._$AU&&t._$AP(p)}if(n!==i||s){let p=t._$AA;for(;p!==n;){const f=lt(p).nextSibling;lt(o).insertBefore(p,i),p=f}}}return t},C=(r,e,t=r)=>(r._$AI(e,t),r),gr={},ur=(r,e=gr)=>r._$AH=e,br=r=>r._$AH,ve=r=>{r._$AR(),r._$AA.remove()};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ht=(r,e,t)=>{const o=new Map;for(let i=e;i<=t;i++)o.set(r[i],i);return o},mr=Zt(class extends At{constructor(r){if(super(r),r.type!==St.CHILD)throw Error("repeat() can only be used in text expressions")}dt(r,e,t){let o;t===void 0?t=e:e!==void 0&&(o=e);const i=[],a=[];let n=0;for(const c of r)i[n]=o?o(c,n):n,a[n]=t(c,n),n++;return{values:a,keys:i}}render(r,e,t){return this.dt(r,e,t).values}update(r,[e,t,o]){const i=br(r),{values:a,keys:n}=this.dt(e,t,o);if(!Array.isArray(i))return this.ut=n,a;const c=this.ut??(this.ut=[]),s=[];let p,f,l=0,g=i.length-1,h=0,u=a.length-1;for(;l<=g&&h<=u;)if(i[l]===null)l++;else if(i[g]===null)g--;else if(c[l]===n[h])s[h]=C(i[l],a[h]),l++,h++;else if(c[g]===n[u])s[u]=C(i[g],a[u]),g--,u--;else if(c[l]===n[u])s[u]=C(i[l],a[u]),D(r,s[u+1],i[l]),l++,u--;else if(c[g]===n[h])s[h]=C(i[g],a[h]),D(r,i[l],i[g]),g--,h++;else if(p===void 0&&(p=ht(n,h,u),f=ht(c,l,g)),p.has(c[l]))if(p.has(c[g])){const x=f.get(n[h]),y=x!==void 0?i[x]:null;if(y===null){const $=D(r,i[l]);C($,a[h]),s[h]=$}else s[h]=C(y,a[h]),D(r,i[l],y),i[x]=null;h++}else ve(i[g]),g--;else ve(i[l]),l++;for(;h<=u;){const x=D(r,s[u+1]);C(x,a[h]),s[h++]=x}for(;l<=g;){const x=i[l++];x!==null&&ve(x)}return this.ut=n,ur(r,s),A}}),pt={software:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',operation:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>',promotion:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>',system:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'},xr={software:"软件消息",operation:"运营信息",promotion:"推广内容",system:"系统消息"};class ze extends b{constructor(){super(),this.category="software",this.noticeTitle="",this.content="",this.imageUrl="",this.popup=!1,this.closable=!1,this.actions=[],this.customCatName="",this.duration=0}_handleClose(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent("cgo-notice-close",{bubbles:!0,composed:!0,detail:{category:this.category,title:this.noticeTitle}}))}_handleAction(e,t){t.stopPropagation(),this.dispatchEvent(new CustomEvent("cgo-notice-action",{bubbles:!0,composed:!0,detail:{action:e.type||e.action||e,title:this.noticeTitle}}))}renderHeaderIcon(){const e=pt[this.category]||pt.software;return d`<span .innerHTML=${e}></span>`}render(){const e=this.customCatName||xr[this.category]||"通知消息",t=Array.isArray(this.actions)&&this.actions.length>0,o=this.duration>0;return d`
            <div class="notice-card cat-${this.category}">
                ${this.closable?d`
                    <div class="close-container">
                        ${o?d`
                            <cgo-spinner
                                mode="progress"
                                size="18"
                                duration="${this.duration}"
                                fill-mode="fill"
                                direction="cw"
                                class="close-spinner"
                            ></cgo-spinner>
                        `:null}
                        <button class="close-btn" @click=${this._handleClose} title="关闭">
                            <cgo-icon name="close" size="12"></cgo-icon>
                        </button>
                    </div>
                `:null}

                <div class="header">
                    ${this.renderHeaderIcon()}
                    <span>${e}</span>
                </div>

                <div class="title">${this.noticeTitle}</div>

                ${this.content?d`<div class="content-body">${this.content}</div>`:null}

                ${this.imageUrl?d`
                    <div class="image-wrap">
                        <img src="${this.imageUrl}" alt="Notice Image" loading="lazy" />
                    </div>
                `:null}

                <slot></slot>

                ${t?d`
                    <div class="actions">
                        ${this.actions.map(i=>{const a=typeof i=="string"?i:i.label||i.type,n=typeof i=="object"&&i.primary;return d`
                                <button class="action-btn ${n?"primary":""}" @click=${c=>this._handleAction(i,c)}>
                                    ${a}
                                </button>
                            `})}
                    </div>
                `:null}
            </div>
        `}}v(ze,"properties",{category:{type:String},noticeTitle:{type:String,attribute:"notice-title"},content:{type:String},imageUrl:{type:String,attribute:"image-url"},popup:{type:Boolean,reflect:!0},closable:{type:Boolean,reflect:!0},actions:{type:Array},customCatName:{type:String,attribute:"cat-name"},duration:{type:Number}}),v(ze,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
            box-sizing: border-box;

            --cat-software: var(--cgopush-cat-software, #0085c4);
            --cat-operation: var(--cgopush-cat-operation, #d29700);
            --cat-promotion: var(--cgopush-cat-promotion, #009655);
            --cat-system: var(--cgopush-cat-system, #6b7280);
        }

        :host([data-theme='dark']),
        :host-context([data-theme='dark']) {
            --cat-software: #38bdf8;
            --cat-operation: #ffca28;
            --cat-promotion: #4ade80;
            --cat-system: #a0b0b9;
        }

        .notice-card {
            position: relative;
            background: var(--card-bg, #ffffff);
            color: var(--text-main, #00263b);
            border-radius: var(--radius-md, 10px);
            border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
            box-shadow: var(--shadow-sm, 0 4px 15px rgba(0, 0, 0, 0.06));
            padding: 12px 14px;
            transition: all 0.25s ease;
            overflow: hidden;
            box-sizing: border-box;
        }

        :host([popup]) .notice-card {
            width: 280px;
            max-width: 80vw;
            padding-right: 34px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }

        .header {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 5px;
            letter-spacing: 0.3px;
            display: flex;
            align-items: center;
            gap: 5px;
            line-height: 1;
        }

        .header svg {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .cat-software .header { color: var(--cat-software); }
        .cat-operation .header { color: var(--cat-operation); }
        .cat-promotion .header { color: var(--cat-promotion); }
        .cat-system .header { color: var(--cat-system); }

        .title {
            font-size: 13px;
            font-weight: 700;
            line-height: 1.4;
            color: var(--text-main, #00263b);
            word-break: break-word;
        }

        :host(:not([popup])) .title {
            font-size: 14px;
            margin-bottom: 6px;
        }

        .content-body {
            font-size: 12px;
            line-height: 1.5;
            color: var(--text-light, #666666);
            margin-top: 6px;
            word-break: break-word;
        }

        :host([popup]) .content-body {
            display: none;
        }

        .image-wrap {
            margin-top: 8px;
            border-radius: var(--radius-xs, 6px);
            overflow: hidden;
            max-height: 120px;
        }

        .image-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .actions {
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
        }

        .action-btn {
            font-size: 11px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: var(--radius-xs, 4px);
            border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
            background: var(--bg-color, #f8f9fa);
            color: var(--text-main, #00263b);
            cursor: pointer;
            transition: all 0.18s ease;
        }

        .action-btn:hover {
            background: var(--tab-hover, rgba(0, 0, 0, 0.06));
            border-color: var(--primary-color, #006098);
            color: var(--primary-color, #006098);
        }

        .action-btn.primary {
            background: var(--primary-color, #006098);
            color: #ffffff;
            border-color: transparent;
        }

        .action-btn.primary:hover {
            background: var(--primary-hover, #004d7a);
        }

        /* 关闭按钮容器与圆形底色 */
        .close-container {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5;
        }

        .close-btn {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.08);
            color: var(--text-main, #00263b);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
            transition: background 0.2s, color 0.2s, transform 0.15s;
            position: relative;
            z-index: 2;
        }

        :host([data-theme='dark']) .close-btn,
        :host-context([data-theme='dark']) .close-btn {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
        }

        .close-btn:hover {
            background: rgba(0, 0, 0, 0.16);
            color: var(--danger-color, #ea4335);
        }

        /* 倒计时进度圆环 */
        .close-spinner {
            position: absolute;
            top: 0;
            left: 0;
            width: 18px;
            height: 18px;
            pointer-events: none;
            z-index: 1;
            --primary-color: var(--cat-software, #0085c4);
            --border-color: rgba(0, 0, 0, 0.12);
        }

        .cat-operation .close-spinner { --primary-color: var(--cat-operation, #d29700); }
        .cat-promotion .close-spinner { --primary-color: var(--cat-promotion, #009655); }
        .cat-system .close-spinner { --primary-color: var(--cat-system, #6b7280); }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-notice-card")||customElements.define("cgo-notice-card",ze));class Ce extends b{constructor(){super(),this.position="top-right",this._popups=[],this._seq=0}push(e,t=5e3){const o=e.id||`popup_${++this._seq}`;let i;return e.isToast?i={id:o,isToast:!0,message:e.message||"",type:e.type||"info",duration:t||3e3,state:"entering"}:i={id:o,isToast:!1,category:e.category||"software",title:e.title||e.noticeTitle||"",content:e.content||"",imageUrl:e.imageUrl||e.image||"",actions:e.actions||[],duration:t,state:"entering"},this._popups=[...this._popups,i],requestAnimationFrame(()=>{this._popups=this._popups.map(a=>a.id===o?{...a,state:"show"}:a)}),t>0&&setTimeout(()=>{this.remove(o)},t),o}remove(e){this._popups=this._popups.map(t=>t.id===e?{...t,state:"leaving"}:t),setTimeout(()=>{this._popups=this._popups.filter(t=>t.id!==e)},400)}clear(){this._popups=this._popups.map(e=>({...e,state:"leaving"})),setTimeout(()=>{this._popups=[]},400)}_handleItemClose(e,t){t.stopPropagation(),this.remove(e),this.dispatchEvent(new CustomEvent("cgo-popup-close",{bubbles:!0,composed:!0,detail:{id:e}}))}_handleItemAction(e,t){this.dispatchEvent(new CustomEvent("cgo-popup-action",{bubbles:!0,composed:!0,detail:{id:e,eventDetail:t.detail}}))}render(){return d`
            ${mr(this._popups,e=>e.id,e=>d`
                <div class="popup-item ${e.state}">
                    ${e.isToast?d`
                        <div class="toast-card ${e.type==="success"?"success":e.type==="error"||e.type==="danger"?"danger":e.type==="warning"?"warning":"info"}">
                            <span class="toast-message">${e.message}</span>
                            <cgo-spinner
                                mode="progress"
                                size="20"
                                duration="${e.duration}"
                                fill-mode="fill"
                                direction="cw"
                                class="toast-progress-ring"
                            ></cgo-spinner>
                        </div>
                    `:d`
                        <cgo-notice-card
                            popup
                            closable
                            category=${e.category}
                            notice-title=${e.title}
                            content=${e.content}
                            image-url=${e.imageUrl}
                            .actions=${e.actions}
                            duration=${e.duration||0}
                            @cgo-notice-close=${t=>this._handleItemClose(e.id,t)}
                            @cgo-notice-action=${t=>this._handleItemAction(e.id,t)}
                        ></cgo-notice-card>
                    `}
                </div>
            `)}
        `}}v(Ce,"properties",{position:{type:String,reflect:!0},_popups:{state:!0}}),v(Ce,"styles",m`
        :host {
            position: fixed;
            z-index: 10010;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
            font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
        }

        :host([position="top-right"]), :host(:not([position])) {
            top: 76px;
            right: 18px;
        }

        :host([position="top-left"]) {
            top: 76px;
            left: 18px;
        }

        :host([position="bottom-right"]) {
            bottom: 24px;
            right: 18px;
        }

        :host([position="bottom-left"]) {
            bottom: 24px;
            left: 18px;
        }

        .popup-item {
            pointer-events: auto;
            transform: translateX(125%);
            opacity: 0;
            max-height: 0;
            overflow: hidden;
            transition: 
                transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                opacity 0.35s ease-out,
                max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                margin-bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .popup-item.show {
            transform: translateX(0);
            opacity: 1;
            max-height: 400px;
            overflow: visible;
        }

        .popup-item.leaving {
            transform: translateX(125%);
            opacity: 0;
            max-height: 0 !important;
            margin-bottom: -10px !important;
            overflow: hidden !important;
        }

        .toast-card {
            width: 280px;
            max-width: 80vw;
            box-sizing: border-box;
            padding: 9px 10px 9px 14px;
            border-radius: var(--radius-md, 10px);
            font-size: 13px;
            font-weight: 500;
            line-height: 1.4;
            word-break: break-word;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
            border: 1px solid rgba(0, 0, 0, 0.05);
            background: var(--text-main, #00263b);
            color: var(--bg-color, #f8f9fa);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .toast-message {
            flex: 1;
        }

        .toast-progress-ring {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            margin-right: 0px;
            --primary-color: rgba(255, 255, 255, 0.95);
            --border-color: rgba(255, 255, 255, 0.25);
        }

        .toast-card.success {
            background: var(--success-color, #34a853);
            color: #ffffff;
        }

        .toast-card.danger {
            background: var(--danger-color, #ea4335);
            color: #ffffff;
        }

        .toast-card.warning {
            background: var(--warning-color, #f59e0b);
            color: #ffffff;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-notice-popup")||customElements.define("cgo-notice-popup",Ce));let V=null;function zt(r,e=5e3){return typeof window>"u"?null:((!V||!document.body.contains(V))&&(V=document.createElement("cgo-notice-popup"),document.body.appendChild(V)),V.push(r,e))}class Ct extends b{show(e,t="info",o=3e3){return Tt(e,t,o)}render(){return d``}}v(Ct,"styles",m`
        :host {
            display: none;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-toast")||customElements.define("cgo-toast",Ct));function Tt(r,e="info",t=3e3){return zt({isToast:!0,message:r,type:e},t)}class Te extends b{constructor(){super(),this.text="",this.placement="top"}render(){return d`
            <slot></slot>
            ${this.text?d`
                      <span class="bubble ${this.placement==="bottom"?"bottom":""}">${this.text}</span>
                  `:null}
        `}}v(Te,"properties",{text:{type:String},placement:{type:String}}),v(Te,"styles",m`
        :host {
            position: relative;
            display: inline-flex;
        }
        .bubble {
            position: absolute;
            bottom: calc(100% + 8px);
            left: 50%;
            transform: translateX(-50%);
            padding: 5px 10px;
            border-radius: var(--radius-xs, 4px);
            background: rgba(0, 0, 0, 0.82);
            color: #fff;
            font-size: var(--text-sm, 12px);
            font-family: var(--font-sans, system-ui, sans-serif);
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity var(--transition-base, 0.2s ease);
            z-index: 200;
        }
        .bubble.bottom {
            bottom: auto;
            top: calc(100% + 8px);
        }
        :host(:hover) .bubble {
            opacity: 1;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-tooltip")||customElements.define("cgo-tooltip",Te));const R=new Set;let vt=!1;function yr(){vt||(vt=!0,document.addEventListener("click",()=>{R.forEach(r=>r.close())}))}class He extends b{constructor(){super(),this.open=!1,this.align="right"}disconnectedCallback(){super.disconnectedCallback(),R.delete(this)}firstUpdated(){yr()}_toggle(e){e.stopPropagation(),this.open?this.close():this.show()}show(){R.forEach(e=>{e!==this&&e.close()}),this.open=!0,R.add(this)}close(){this.open&&(this.open=!1,R.delete(this))}_onMenuClick(e){e.target.closest("a, button, .dropdown-item")&&this.close()}render(){return d`
            <div class="trigger" @click=${this._toggle}>
                <slot name="trigger"></slot>
            </div>
            <div class="menu" @click=${this._onMenuClick}>
                <slot></slot>
            </div>
        `}}v(He,"properties",{open:{type:Boolean,reflect:!0},align:{type:String}}),v(He,"styles",m`
        :host {
            position: relative;
            display: inline-block;
        }
        .menu {
            display: none;
            position: absolute;
            top: calc(100% + 6px);
            right: 0;
            min-width: 180px;
            background: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-md, 8px);
            box-shadow: var(--shadow-xl, 0 18px 46px rgba(0, 0, 0, 0.16));
            z-index: 500;
            padding: 6px;
            overflow: hidden;
            animation: dropdownIn 0.15s ease;
        }
        :host([align='left']) .menu {
            right: auto;
            left: 0;
        }
        :host([align='center']) .menu {
            right: auto;
            left: 50%;
            transform: translateX(-50%);
        }
        :host([open]) .menu {
            display: block;
        }
        @keyframes dropdownIn {
            from {
                opacity: 0;
                transform: translateY(-6px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        /* 暴露给 light DOM 菜单项的统一样式（::slotted）
           注意：用 !important 抵消外层文档 cgo_element.css 的 *{padding:0} 全局重置，
           否则菜单项会塌成单行、行间距过挤。*/
        ::slotted(a),
        ::slotted(button),
        ::slotted(.dropdown-item) {
            display: flex !important;
            align-items: center;
            gap: 8px;
            padding: 9px 12px !important;
            margin: 0 !important;
            border-radius: var(--radius-xs, 4px);
            color: var(--text-main, #00263b);
            font-size: var(--text-base, 14px);
            line-height: 1.6;
            text-decoration: none;
            cursor: pointer;
            white-space: nowrap;
            border: none;
            background: none;
            box-sizing: border-box;
            width: 100%;
            text-align: left;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        ::slotted(a:hover),
        ::slotted(button:hover),
        ::slotted(.dropdown-item:hover) {
            background: var(--btn-info-hover, #e9ecef) !important;
        }
        /* 分隔线 */
        ::slotted(.dropdown-divider) {
            display: block !important;
            height: 1px;
            margin: 5px 0 !important;
            background: var(--border-color, #dee2e6);
        }
        /* 菜单内图标尺寸对齐 */
        ::slotted(a) cgo-icon,
        ::slotted(button) cgo-icon {
            flex-shrink: 0;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-dropdown")||customElements.define("cgo-dropdown",He));class Pe extends b{constructor(){super(),this.open=!1,this.title="",this.maxWidth="",this.closeOnOverlay=!0,this._onKey=this._onKey.bind(this)}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this._onKey)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this._onKey)}_onKey(e){e.key==="Escape"&&this.open&&this._close()}_close(){this.open=!1,this.dispatchEvent(new CustomEvent("cgo-close",{bubbles:!0,composed:!0}))}show(){this.open=!0}render(){if(!this.open)return d``;const e=this.maxWidth?`width:min(${this.maxWidth},92dvw)`:"";return d`
            <div class="overlay" @click=${()=>this.closeOnOverlay&&this._close()}></div>
            <div class="dialog" style=${e} role="dialog" aria-modal="true">
                <button class="close" @click=${this._close} aria-label="关闭"><cgo-icon name="close" size="14"></cgo-icon></button>
                ${this.title?d`
                          <h3 class="title">${this.title}</h3>
                      `:null}
                <div class="body"><slot></slot></div>
            </div>
        `}}v(Pe,"properties",{open:{type:Boolean,reflect:!0},title:{type:String},maxWidth:{type:String,attribute:"max-width"},closeOnOverlay:{type:Boolean,attribute:"close-on-overlay"}}),v(Pe,"styles",m`
        :host {
            display: none;
        }
        :host([open]) {
            display: block;
        }
        .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            z-index: 9000;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        .dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--panel-bg, #fff);
            color: var(--text-main, #00263b);
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-lg, 12px);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
            z-index: 9001;
            width: min(560px, 92dvw);
            max-height: 90dvh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            animation: dialogIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes dialogIn {
            from {
                opacity: 0;
                transform: translate(-50%, -48%) scale(0.96);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        .close {
            position: absolute;
            top: 12px;
            right: 16px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.6rem;
            color: var(--text-light, #666);
            line-height: 1;
            padding: 0;
            z-index: 1;
            transition: color 0.2s;
        }
        .close:hover {
            color: var(--text-main, #00263b);
        }
        .title {
            margin: 0;
            padding: 22px 25px 0;
            font-size: 18px;
            font-weight: 700;
        }
        .body {
            padding: 16px 25px 22px;
            overflow-y: auto;
            color: var(--text-main, #00263b);
            font-family: var(--font-sans, system-ui, sans-serif);
            line-height: 1.6;
        }
        .body::slotted(p) {
            margin: 0 0 10px;
        }
        .body::slotted(.dialog-buttons) {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 16px;
        }
        @media screen and (max-width: 600px) {
            .dialog {
                top: auto;
                bottom: 0;
                left: 0;
                transform: none;
                width: 100dvw !important;
                max-width: 100dvw !important;
                max-height: 85dvh;
                border-radius: 20px 20px 0 0;
                animation: drawerIn 0.3s cubic-bezier(0.32, 0.94, 0.6, 1);
            }
        }
        @keyframes drawerIn {
            from {
                transform: translateY(100%);
            }
            to {
                transform: translateY(0);
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-modal")||customElements.define("cgo-modal",Pe));class Le extends b{constructor(){super(),this.label="",this.active=!1}render(){return d`
            <slot></slot>
        `}}v(Le,"properties",{label:{type:String},active:{type:Boolean,reflect:!0}}),v(Le,"styles",m`
        :host {
            display: none;
        }
        :host([active]) {
            display: block;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-tab")||customElements.define("cgo-tab",Le));class Ie extends b{constructor(){super(),this.index=0}get _tabs(){return[...this.querySelectorAll("cgo-tab")]}_select(e){this.index=e,this._tabs.forEach((t,o)=>{t.active=o===e}),this.dispatchEvent(new CustomEvent("cgo-tab-change",{detail:{index:e},bubbles:!0,composed:!0}))}firstUpdated(){this._select(this.index||0)}render(){const e=this._tabs;return d`
            <div class="bar">
                ${e.map((t,o)=>d`
                        <div class="tab ${o===this.index?"active":""}" @click=${()=>this._select(o)}>
                            ${t.label}
                        </div>
                    `)}
            </div>
            <div class="panels"><slot></slot></div>
        `}}v(Ie,"properties",{index:{type:Number}}),v(Ie,"styles",m`
        :host {
            display: block;
            width: 100%;
        }
        .bar {
            width: 100%;
            overflow-x: auto;
            background: var(--tab-bg, #f1f3f5);
            border-bottom: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-lg, 12px) var(--radius-lg, 12px) 0 0;
            scrollbar-width: none;
            display: flex;
        }
        .bar::-webkit-scrollbar {
            display: none;
        }
        .tab {
            padding: 12px 20px;
            cursor: pointer;
            font-size: var(--text-base, 14px);
            color: var(--text-light, #666);
            border-bottom: 3px solid transparent;
            transition: all var(--transition-base, 0.2s ease);
            font-weight: 500;
            white-space: nowrap;
            user-select: none;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        .tab:hover {
            color: var(--text-main, #00263b);
            background: var(--tab-hover, rgba(0, 0, 0, 0.03));
        }
        .tab.active {
            color: var(--primary-color, #006098);
            font-weight: 700;
            background: var(--card-bg, #fff);
            border-bottom-color: var(--primary-color, #006098);
        }
        .panels {
            background: var(--card-bg, #fff);
            padding: 36px 40px;
            border-radius: 0 0 var(--radius-lg, 12px) var(--radius-lg, 12px);
            box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
            min-height: 104px;
            box-sizing: border-box;
            color: var(--text-main, #00263b);
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        @media (max-width: 600px) {
            .tab {
                padding: 11px 16px;
            }
            .panels {
                padding: 26px 24px;
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-tabs")||customElements.define("cgo-tabs",Ie));class Ne extends b{constructor(){super(),this.name="",this.src="",this.color="",this.size="60"}_initials(){if(!this.name)return"";const e=this.name.trim();return/[一-龥]/.test(e)?e.slice(-1):e.split(/\s+/).map(t=>t[0]).slice(0,2).join("").toUpperCase()}render(){const e=/^\d+$/.test(this.size)?this.size+"px":this.size,t=this.color||"var(--primary-color, #006098)",o=`--cgo-avatar-size:${e};${this.src?"":`background:${t}`}`;return d`
            <div class="av" style=${o}>
                ${this.src?d`
                          <img src=${this.src} alt=${this.name||"avatar"} />
                      `:d`
                          <span>${this._initials()}</span>
                      `}
            </div>
        `}}v(Ne,"properties",{name:{type:String},src:{type:String},color:{type:String},size:{type:String}}),v(Ne,"styles",m`
        :host {
            display: inline-flex;
        }
        .av {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            overflow: hidden;
            background: var(--card-bg, #fff);
            box-shadow: var(--shadow-md, 0 4px 15px rgba(0, 0, 0, 0.08));
            color: #fff;
            font-family: var(--font-sans, system-ui, sans-serif);
            font-weight: 700;
            width: var(--cgo-avatar-size, 60px);
            height: var(--cgo-avatar-size, 60px);
            font-size: calc(var(--cgo-avatar-size, 60px) * 0.4);
        }
        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-avatar")||customElements.define("cgo-avatar",Ne));class Oe extends b{constructor(){super(),this.role="bot",this.sender="",this.time=""}render(){const e=this.sender||this.time?d`
                      <div class="meta">${[this.sender,this.time].filter(Boolean).join(" · ")}</div>
                  `:null;return d`
            <div class="bubble ${this.role==="user"?"user":"bot"}"><slot></slot></div>
            ${e}
        `}}v(Oe,"properties",{role:{type:String},sender:{type:String},time:{type:String}}),v(Oe,"styles",m`
        :host {
            display: flex;
            flex-direction: column;
            margin: 6px 0;
            align-items: flex-start;
        }
        :host([role='user']) {
            align-items: flex-end;
        }
        .bubble {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 16px;
            font-size: var(--text-base, 14px);
            line-height: 1.5;
            font-family: var(--font-sans, system-ui, sans-serif);
            word-break: break-word;
        }
        .bot {
            background: var(--btn-info-bg, #e9ecef);
            color: var(--text-main, #00263b);
            border-radius: 16px 16px 16px 4px;
        }
        .user {
            background: var(--primary-color, #006098);
            color: var(--btn-text, #fff);
            border-radius: 16px 16px 4px 16px;
        }
        .meta {
            font-size: var(--text-xs, 11px);
            color: var(--text-light, #666);
            margin-top: 4px;
            padding: 0 4px;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-chat-bubble")||customElements.define("cgo-chat-bubble",Oe));function Ht(){const r=Math.floor(Math.random()*10)+1,e=Math.floor(Math.random()*10)+1,t=["+","-"][Math.floor(Math.random()*2)];let o="",i=0;if(t==="+")o=`${r} + ${e} = ?`,i=r+e;else{const h=Math.max(r,e),u=Math.min(r,e);o=`${h} - ${u} = ?`,i=h-u}const a=120,n=36;let c="";for(let h=0;h<3;h++){const u=Math.floor(Math.random()*a),x=Math.floor(Math.random()*n),y=Math.floor(Math.random()*a),$=Math.floor(Math.random()*n),I=`rgb(${Math.floor(Math.random()*120)+50},${Math.floor(Math.random()*120)+50},${Math.floor(Math.random()*120)+50})`;c+=`<line x1="${u}" y1="${x}" x2="${y}" y2="${$}" stroke="${I}" stroke-width="1.5" />`}let s="";for(let h=0;h<30;h++){const u=Math.floor(Math.random()*a),x=Math.floor(Math.random()*n),y=Math.random()*1.2+.4,$=`rgb(${Math.floor(Math.random()*150)+50},${Math.floor(Math.random()*150)+50},${Math.floor(Math.random()*150)+50})`;s+=`<circle cx="${u}" cy="${x}" r="${y}" fill="${$}" />`}const p=o.split(" ");let f="",l=12;for(const h of p){const u=Math.floor(Math.random()*24)-12,x=Math.floor(Math.random()*8)-4,y=`rgb(${Math.floor(Math.random()*120)},${Math.floor(Math.random()*120)},${Math.floor(Math.random()*120)})`;f+=`<text x="${l}" y="${25+x}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${y}" transform="rotate(${u}, ${l+5}, ${22+x})">${h}</text>`,l+=h.length*10+6}return{svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a} ${n}" style="background:#f3f4f6;border-radius:4px;user-select:none;width:100%;height:100%;display:block;">${c}${f}${s}</svg>`,answer:String(i)}}class Be extends b{constructor(){super(),this.answer="",this.zoom=!1,this.zoomed=!1,this._svg="",this.refresh()}refresh(){const{svg:e,answer:t}=Ht();this.answer=t,this._svg=e,this.dispatchEvent(new CustomEvent("cgo-captcha-refresh",{detail:{answer:t},bubbles:!0,composed:!0}))}render(){const e=document.createElement("template");return e.innerHTML=this._svg,d`
            ${this.zoom?d`
                      <button
                          class="zoom-btn"
                          type="button"
                          title=${this.zoomed?"收起验证码":"放大验证码"}
                          @click=${t=>{t.stopPropagation(),this.zoomed=!this.zoomed}}
                      >
                          <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                          >
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              ${this.zoomed?d`
                                        <line x1="8" y1="11" x2="14" y2="11"></line>
                                    `:d`
                                        <line x1="11" y1="8" x2="11" y2="14"></line>
                                        <line x1="8" y1="11" x2="14" y2="11"></line>
                                    `}
                          </svg>
                      </button>
                  `:null}
            <div class="box" title="点击刷新" @click=${()=>this.refresh()}>${e.content.cloneNode(!0)}</div>
        `}}v(Be,"properties",{answer:{type:String},zoom:{type:Boolean,reflect:!0},zoomed:{type:Boolean,reflect:!0},_svg:{state:!0}}),v(Be,"styles",m`
        :host {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .zoom-btn {
            width: 38px;
            height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-sm, 6px);
            background: var(--btn-info-bg, #e9ecef);
            color: var(--btn-info-text, #495057);
            cursor: pointer;
            flex-shrink: 0;
        }
        .zoom-btn:hover {
            background: var(--btn-info-hover, #dee2e6);
            color: var(--text-main, #00263b);
        }
        .zoom-btn svg {
            width: 19px;
            height: 19px;
        }
        .box {
            width: 120px;
            height: 36px;
            cursor: pointer;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-xs, 4px);
            overflow: hidden;
            transform-origin: left center;
            transition:
                transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.2s ease;
        }
        :host([zoomed]) .box {
            transform: scale(1.65);
            box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.12));
            z-index: 3;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-captcha")||customElements.define("cgo-captcha",Be));const wr=':root{--bg-color: #f8f9fa;--bg-body: var(--bg-color);--card-bg: #ffffff;--panel-bg: #ffffff;--bg-card: var(--card-bg);--text-main: #00263b;--text-light: #636f75;--text-color: var(--text-main);--border-color: #dee2e6;--primary-color: #00263b;--primary-hover: #004060;--btn-text: #ffffff;--header-bg: #ffffff;--header-height: 60px;--footer-bg: #ffffff;--btn-info-bg: #e9ecef;--btn-info-text: #495057;--btn-info-hover: #dee2e6;--table-head-bg: #f1f3f5;--table-head-text: #00263b;--table-row-hover: #f8f9fa;--table-cell-border: #eeeeee;--tab-bg: #f8f9fa;--tab-hover: rgba(0, 0, 0, .03);--help-code-bg: #f7f9fa;--filter-tag-bg: #f8f9fa;--filter-toolbar-bg: #eef2f7}[data-theme=dark]{--bg-color: #1a1a1a;--bg-body: var(--bg-color);--card-bg: #1f2020;--panel-bg: #1f2020;--bg-card: var(--card-bg);--text-main: #e5e8ea;--text-light: #a0b0b9;--text-color: var(--text-main);--border-color: #333333;--primary-color: #006098;--primary-hover: #0070b0;--btn-text: #ffffff;--header-bg: #1f2020;--footer-bg: #1f2020;--btn-info-bg: #373838;--btn-info-text: #e5e8ea;--btn-info-hover: #4a4b4c;--table-head-bg: #2c2d2e;--table-head-text: #e5e8ea;--table-row-hover: #2a2b2c;--table-cell-border: #333333;--tab-bg: #2c2d2e;--tab-hover: rgba(255, 255, 255, .05);--help-code-bg: #2a2a2a;--filter-tag-bg: #2c2d2e;--filter-toolbar-bg: #2c2d2e}:root{--success-color: #34a853;--success-bg: #e6ffed;--success-border: #a8d5b5;--warning-color: #f59e0b;--warning-bg: rgba(255, 243, 205, .5);--warning-border: rgba(255, 238, 186, .5);--danger-color: #ea4335;--danger-hover: #b3261e;--danger-bg: #fff1f1;--danger-border: #e58f8f;--info-color: #006098;--info-bg: #e8f0fe;--info-border: #b8d0ee;--diff-bg: #efbdc3;--diff-text: #d93025;--same-bg: #e6ffed;--same-text: #137333;--selected-bg: #e8f0fe}[data-theme=dark]{--success-color: #34a853;--success-bg: #1b3e20;--success-border: #2d5c36;--warning-color: #f59e0b;--warning-bg: rgba(100, 75, 0, .2);--warning-border: rgba(120, 90, 0, .3);--danger-color: #ea4335;--danger-hover: #ff5252;--danger-bg: #3b0f0f;--danger-border: #7a2424;--info-color: #006098;--info-bg: #1a2a3a;--info-border: #2a4060;--diff-bg: #5c1b1b;--diff-text: #ea4335;--same-bg: #1b3e20;--same-text: #34a853;--selected-bg: rgba(66, 133, 244, .2)}:root{--permission-enabled: #16803d;--permission-enabled-soft: #edf8f1;--permission-enabled-border: #badfc8;--permission-disabled: #52637a;--permission-disabled-soft: #f0f4f8;--permission-disabled-border: #b9c5d4;--permission-hidden: #c62828;--permission-hidden-soft: #fff1f1;--permission-hidden-border: #e58f8f;--permission-inherit: #64748b;--permission-inherit-soft: #f2f5f8;--permission-inherit-border: #d2dbe6}[data-theme=dark]{--permission-enabled: #81c995;--permission-enabled-soft: #163820;--permission-enabled-border: #245934;--permission-disabled: #94a3b8;--permission-disabled-soft: #202936;--permission-disabled-border: #334155;--permission-hidden: #ff8a80;--permission-hidden-soft: #3d1414;--permission-hidden-border: #5c1c1c;--permission-inherit: #a1b0cb;--permission-inherit-soft: #242d3d;--permission-inherit-border: #37455d}:root{--glass-bg: rgba(255, 255, 255, .7);--glass-border: rgba(255, 255, 255, .4);--glass-shadow: rgba(0, 0, 0, .08);--sidebar-width: 220px}[data-theme=dark]{--glass-bg: rgba(31, 32, 32, .6);--glass-border: rgba(255, 255, 255, .05);--glass-shadow: rgba(0, 0, 0, .25)}:root{--map-bg: #ffffff;--station-stroke: #00263b;--not-open-color: #bdcbd2;--panel-header-bg: #00263b;--panel-header-text: #ffffff;--close-btn-color: rgba(255, 255, 255, .6);--capsule-bg: #ffffff;--capsule-text: #333333;--stops-tag-bg: #f0f2f5;--control-bg: #ffffff;--ctrl-btn-bg: #f0f2f5;--ctrl-icon: #333333;--ctrl-hover: #e1e4e8;--divider: #e0e0e0;--list-hover: #f0f2f5;--sta-stroke-width-cn: 2px;--sta-stroke-width-en: 1.75px}[data-theme=dark]{--map-bg: #1a1a1a;--station-stroke: #bdcbd2;--not-open-color: #4e4e4e;--panel-header-bg: #373838;--panel-header-text: #e5e8ea;--close-btn-color: #78848b;--capsule-bg: #1f2020;--capsule-text: #78848b;--stops-tag-bg: #78848b;--control-bg: #1f2020;--ctrl-btn-bg: #373838;--ctrl-icon: #78848b;--ctrl-hover: #4f4f4f;--divider: #333333;--list-hover: #373838}.line-bg{color:var(--line-color-text-light);display:inline-block}.line-bg.line-1号线八通线,.filter-tag[data-line="1号线八通线"].active{background-color:var(--line-color-1);color:var(--line-color-text-light)}.line-bg.line-2号线,.filter-tag[data-line="2号线"].active{background-color:var(--line-color-2);color:var(--line-color-text-light)}.line-bg.line-3号线,.filter-tag[data-line="3号线"].active{background-color:var(--line-color-3);color:var(--line-color-text-light)}.line-bg.line-4号线大兴线,.filter-tag[data-line="4号线大兴线"].active{background-color:var(--line-color-4);color:var(--line-color-text-light)}.line-bg.line-5号线,.filter-tag[data-line="5号线"].active{background-color:var(--line-color-5);color:var(--line-color-text-light)}.line-bg.line-6号线,.filter-tag[data-line="6号线"].active{background-color:var(--line-color-6);color:var(--line-color-text-light)}.line-bg.line-7号线,.filter-tag[data-line="7号线"].active{background-color:var(--line-color-7);color:var(--line-color-text-dark)}.line-bg.line-8号线,.filter-tag[data-line="8号线"].active{background-color:var(--line-color-8);color:var(--line-color-text-light)}.line-bg.line-9号线,.filter-tag[data-line="9号线"].active{background-color:var(--line-color-9);color:var(--line-color-text-dark)}.line-bg.line-10号线,.filter-tag[data-line="10号线"].active{background-color:var(--line-color-10);color:var(--line-color-text-light)}.line-bg.line-11号线,.filter-tag[data-line="11号线"].active{background-color:var(--line-color-11);color:var(--line-color-text-light)}.line-bg.line-12号线,.filter-tag[data-line="12号线"].active{background-color:var(--line-color-12);color:var(--line-color-text-light)}.line-bg.line-13号线,.filter-tag[data-line="13号线"].active{background-color:var(--line-color-13);color:var(--line-color-text-dark)}.line-bg.line-14号线,.filter-tag[data-line="14号线"].active{background-color:var(--line-color-14);color:var(--line-color-text-dark)}.line-bg.line-15号线,.filter-tag[data-line="15号线"].active{background-color:var(--line-color-15);color:var(--line-color-text-light)}.line-bg.line-16号线,.filter-tag[data-line="16号线"].active{background-color:var(--line-color-16);color:var(--line-color-text-light)}.line-bg.line-17号线,.filter-tag[data-line="17号线"].active{background-color:var(--line-color-17);color:var(--line-color-text-light)}.line-bg.line-18号线,.filter-tag[data-line="18号线"].active{background-color:var(--line-color-18);color:var(--line-color-text-light)}.line-bg.line-19号线,.filter-tag[data-line="19号线"].active{background-color:var(--line-color-19);color:var(--line-color-text-dark)}.line-bg.line-22号线,.filter-tag[data-line="22号线"].active{background-color:var(--line-color-22);color:var(--line-color-text-dark)}.line-bg.line-28号线,.filter-tag[data-line="28号线"].active{background-color:var(--line-color-28);color:var(--line-color-text-light)}.line-bg.line-亦庄线,.filter-tag[data-line=亦庄线].active{background-color:var(--line-color-24);color:var(--line-color-text-light)}.line-bg.line-亦庄T1线,.filter-tag[data-line=亦庄T1线].active{background-color:var(--line-color-t1);color:var(--line-color-text-light)}.line-bg.line-房山线,.filter-tag[data-line=房山线].active{background-color:var(--line-color-25);color:var(--line-color-text-light)}.line-bg.line-燕房线,.filter-tag[data-line=燕房线].active{background-color:var(--line-color-25w);color:var(--line-color-text-light)}.line-bg.line-S1线,.filter-tag[data-line=S1线].active{background-color:var(--line-color-26);color:var(--line-color-text-light)}.line-bg.line-昌平线,.filter-tag[data-line=昌平线].active{background-color:var(--line-color-27);color:var(--line-color-text-dark)}.line-bg.line-西郊线,.filter-tag[data-line=西郊线].active{background-color:var(--line-color-xj);color:var(--line-color-text-light)}.line-bg.line-首都机场线,.filter-tag[data-line=首都机场线].active{background-color:var(--line-color-cae);color:var(--line-color-text-dark)}.line-bg.line-大兴机场线,.filter-tag[data-line=大兴机场线].active{background-color:var(--line-color-dae);color:var(--line-color-text-light)}.line-bg.line-市郊S1线,.filter-tag[data-line=市郊S1线].active{background-color:var(--line-color-sub-s1);color:var(--line-color-text-light)}.line-bg.line-市郊S2线,.filter-tag[data-line=市郊S2线].active{background-color:var(--line-color-sub-s2);color:var(--line-color-text-light)}.line-bg.line-市郊S5线,.filter-tag[data-line=市郊S5线].active{background-color:var(--line-color-sub-s5);color:var(--line-color-text-light)}.line-bg.line-市郊S6线,.filter-tag[data-line=市郊S6线].active{background-color:var(--line-color-sub-s6);color:var(--line-color-text-light)}.filter-tag[data-line=all].active{background:var(--primary-color);color:var(--line-color-text-light)}.line-tag{display:inline-block;margin-left:5px;padding:1px 6px;border-radius:10px;font-size:11px;white-space:nowrap;vertical-align:middle}:root{--line-1-official: #c23a30;--line-2-official: #006098;--line-3-official: #e60033;--line-4-official: #008e9c;--line-5-official: #a6217f;--line-6-official: #d29700;--line-7-official: #fac671;--line-8-official: #009b6b;--line-9-official: #8fc31f;--line-10-official: #009bc0;--line-11-official: #ed796b;--line-12-official: #c76b00;--line-13-official: #f9e700;--line-14-official: #d5a7a1;--line-15-official: #6a357d;--line-16-official: #76a32d;--line-17-official: #00a9a9;--line-18-official: #5654a2;--line-19-official: #d6abc1;--line-22-official: #f7c8ce;--line-28-official: #35570b;--line-24-official: #e40077;--line-t1-official: #e6081b;--line-25-official: #e46022;--line-25w-official: #e46022;--line-26-official: #b25921;--line-27-official: #de82b2;--line-xj-official: #e6081b;--line-cae-official: #a29bbb;--line-dae-official: #004ba0;--line-sub-s1-official: #717071;--line-sub-s2-official: #717071;--line-sub-s5-official: #717071;--line-sub-s6-official: #717071;--line-text-light-official: #ffffff;--line-text-dark-official: #002538;--line-1-screen: #c23a30;--line-2-screen: #006098;--line-3-screen: #e60033;--line-4-screen: #008e9c;--line-5-screen: #a6217f;--line-6-screen: #d29700;--line-7-screen: #fac671;--line-8-screen: #009b63;--line-9-screen: #abcd03;--line-10-screen: #00a3c9;--line-11-screen: #ed796b;--line-12-screen: #c76b00;--line-13-screen: #f8de00;--line-14-screen: #d5a7a9;--line-15-screen: #6a357d;--line-16-screen: #6e992a;--line-17-screen: #00adb2;--line-18-screen: #5654a2;--line-19-screen: #d5abce;--line-22-screen: #f7c8ce;--line-28-screen: #35570b;--line-24-screen: #e40077;--line-t1-screen: #d80618;--line-25-screen: #e46022;--line-25w-screen: #e46022;--line-26-screen: #b25921;--line-27-screen: #ee87b4;--line-xj-screen: #d80618;--line-cae-screen: #a29bbb;--line-dae-screen: #004ba0;--line-sub-s1-screen: #d93932;--line-sub-s2-screen: #4080b7;--line-sub-s5-screen: #e98d95;--line-sub-s6-screen: #919a47;--line-text-light-screen: #ffffff;--line-text-dark-screen: #00263b;--line-color-1: var(--line-1-screen);--line-color-2: var(--line-2-screen);--line-color-3: var(--line-3-screen);--line-color-4: var(--line-4-screen);--line-color-5: var(--line-5-screen);--line-color-6: var(--line-6-screen);--line-color-7: var(--line-7-screen);--line-color-8: var(--line-8-screen);--line-color-9: var(--line-9-screen);--line-color-10: var(--line-10-screen);--line-color-11: var(--line-11-screen);--line-color-12: var(--line-12-screen);--line-color-13: var(--line-13-screen);--line-color-14: var(--line-14-screen);--line-color-15: var(--line-15-screen);--line-color-16: var(--line-16-screen);--line-color-17: var(--line-17-screen);--line-color-18: var(--line-18-screen);--line-color-19: var(--line-19-screen);--line-color-22: var(--line-22-screen);--line-color-28: var(--line-28-screen);--line-color-24: var(--line-24-screen);--line-color-t1: var(--line-t1-screen);--line-color-25: var(--line-25-screen);--line-color-25w: var(--line-25w-screen);--line-color-26: var(--line-26-screen);--line-color-27: var(--line-27-screen);--line-color-xj: var(--line-xj-screen);--line-color-cae: var(--line-cae-screen);--line-color-dae: var(--line-dae-screen);--line-color-sub-s1: var(--line-sub-s1-screen);--line-color-sub-s2: var(--line-sub-s2-screen);--line-color-sub-s5: var(--line-sub-s5-screen);--line-color-sub-s6: var(--line-sub-s6-screen);--line-color-text-light: var(--line-text-light-screen);--line-color-text-dark: var(--line-text-dark-screen)}[data-color-palette=official]{--line-color-1: var(--line-1-official);--line-color-2: var(--line-2-official);--line-color-3: var(--line-3-official);--line-color-4: var(--line-4-official);--line-color-5: var(--line-5-official);--line-color-6: var(--line-6-official);--line-color-7: var(--line-7-official);--line-color-8: var(--line-8-official);--line-color-9: var(--line-9-official);--line-color-10: var(--line-10-official);--line-color-11: var(--line-11-official);--line-color-12: var(--line-12-official);--line-color-13: var(--line-13-official);--line-color-14: var(--line-14-official);--line-color-15: var(--line-15-official);--line-color-16: var(--line-16-official);--line-color-17: var(--line-17-official);--line-color-18: var(--line-18-official);--line-color-19: var(--line-19-official);--line-color-22: var(--line-22-official);--line-color-28: var(--line-28-official);--line-color-24: var(--line-24-official);--line-color-t1: var(--line-t1-official);--line-color-25: var(--line-25-official);--line-color-25w: var(--line-25w-official);--line-color-26: var(--line-26-official);--line-color-27: var(--line-27-official);--line-color-xj: var(--line-xj-official);--line-color-cae: var(--line-cae-official);--line-color-dae: var(--line-dae-official);--line-color-sub-s1: var(--line-sub-s1-official);--line-color-sub-s2: var(--line-sub-s2-official);--line-color-sub-s5: var(--line-sub-s5-official);--line-color-sub-s6: var(--line-sub-s6-official);--line-color-text-light: var(--line-text-light-official);--line-color-text-dark: var(--line-text-dark-official)}[data-color-palette=screen]{--line-color-1: var(--line-1-screen);--line-color-2: var(--line-2-screen);--line-color-3: var(--line-3-screen);--line-color-4: var(--line-4-screen);--line-color-5: var(--line-5-screen);--line-color-6: var(--line-6-screen);--line-color-7: var(--line-7-screen);--line-color-8: var(--line-8-screen);--line-color-9: var(--line-9-screen);--line-color-10: var(--line-10-screen);--line-color-11: var(--line-11-screen);--line-color-12: var(--line-12-screen);--line-color-13: var(--line-13-screen);--line-color-14: var(--line-14-screen);--line-color-15: var(--line-15-screen);--line-color-16: var(--line-16-screen);--line-color-17: var(--line-17-screen);--line-color-18: var(--line-18-screen);--line-color-19: var(--line-19-screen);--line-color-22: var(--line-22-screen);--line-color-28: var(--line-28-screen);--line-color-24: var(--line-24-screen);--line-color-t1: var(--line-t1-screen);--line-color-25: var(--line-25-screen);--line-color-25w: var(--line-25w-screen);--line-color-26: var(--line-26-screen);--line-color-27: var(--line-27-screen);--line-color-xj: var(--line-xj-screen);--line-color-cae: var(--line-cae-screen);--line-color-dae: var(--line-dae-screen);--line-color-sub-s1: var(--line-sub-s1-screen);--line-color-sub-s2: var(--line-sub-s2-screen);--line-color-sub-s5: var(--line-sub-s5-screen);--line-color-sub-s6: var(--line-sub-s6-screen);--line-color-text-light: var(--line-text-light-screen);--line-color-text-dark: var(--line-text-dark-screen)}:root{--avatar-color-red: #d93025;--avatar-color-orange: #e46022;--avatar-color-amber: #d29700;--avatar-color-yellow: #e8b800;--avatar-color-lime: #8fc31f;--avatar-color-green: #009655;--avatar-color-teal: #008e9c;--avatar-color-sky: #009bc0;--avatar-color-blue: #006098;--avatar-color-indigo: #3a4db8;--avatar-color-purple: #6a357d;--avatar-color-pink: #de82b2;--avatar-color-brown: #b25921;--avatar-color-gray: #78848b;--avatar-color-dark: #00263b;--avatar-color-0: #ef4444;--avatar-color-1: #f87171;--avatar-color-2: #f97316;--avatar-color-3: #fb923c;--avatar-color-4: #f59e0b;--avatar-color-5: #eab308;--avatar-color-6: #fef08a;--avatar-color-7: #84cc16;--avatar-color-8: #a3e635;--avatar-color-9: #22c55e;--avatar-color-10: #10b981;--avatar-color-11: #059669;--avatar-color-12: #064e3b;--avatar-color-13: #0d9488;--avatar-color-14: #14b8a6;--avatar-color-15: #22d3ee;--avatar-color-16: #38bdf8;--avatar-color-17: #2563eb;--avatar-color-18: #1d4ed8;--avatar-color-19: #1e3a8a;--avatar-color-20: #4f46e5;--avatar-color-21: #6366f1;--avatar-color-22: #8b5cf6;--avatar-color-23: #c084fc;--avatar-color-24: #d946ef;--avatar-color-25: #ec4899;--avatar-color-26: #f472b6;--avatar-color-27: #fda4af;--avatar-color-28: #64748b;--avatar-color-29: #334155}.avatar-color-red{color:var(--avatar-color-red);fill:var(--avatar-color-red)}.avatar-color-orange{color:var(--avatar-color-orange);fill:var(--avatar-color-orange)}.avatar-color-amber{color:var(--avatar-color-amber);fill:var(--avatar-color-amber)}.avatar-color-yellow{color:var(--avatar-color-yellow);fill:var(--avatar-color-yellow)}.avatar-color-lime{color:var(--avatar-color-lime);fill:var(--avatar-color-lime)}.avatar-color-green{color:var(--avatar-color-green);fill:var(--avatar-color-green)}.avatar-color-teal{color:var(--avatar-color-teal);fill:var(--avatar-color-teal)}.avatar-color-sky{color:var(--avatar-color-sky);fill:var(--avatar-color-sky)}.avatar-color-blue{color:var(--avatar-color-blue);fill:var(--avatar-color-blue)}.avatar-color-indigo{color:var(--avatar-color-indigo);fill:var(--avatar-color-indigo)}.avatar-color-purple{color:var(--avatar-color-purple);fill:var(--avatar-color-purple)}.avatar-color-pink{color:var(--avatar-color-pink);fill:var(--avatar-color-pink)}.avatar-color-brown{color:var(--avatar-color-brown);fill:var(--avatar-color-brown)}.avatar-color-gray{color:var(--avatar-color-gray);fill:var(--avatar-color-gray)}.avatar-color-dark{color:var(--avatar-color-dark);fill:var(--avatar-color-dark)}.avatar-color-0{color:var(--avatar-color-0);fill:var(--avatar-color-0)}.avatar-color-1{color:var(--avatar-color-1);fill:var(--avatar-color-1)}.avatar-color-2{color:var(--avatar-color-2);fill:var(--avatar-color-2)}.avatar-color-3{color:var(--avatar-color-3);fill:var(--avatar-color-3)}.avatar-color-4{color:var(--avatar-color-4);fill:var(--avatar-color-4)}.avatar-color-5{color:var(--avatar-color-5);fill:var(--avatar-color-5)}.avatar-color-6{color:var(--avatar-color-6);fill:var(--avatar-color-6)}.avatar-color-7{color:var(--avatar-color-7);fill:var(--avatar-color-7)}.avatar-color-8{color:var(--avatar-color-8);fill:var(--avatar-color-8)}.avatar-color-9{color:var(--avatar-color-9);fill:var(--avatar-color-9)}.avatar-color-10{color:var(--avatar-color-10);fill:var(--avatar-color-10)}.avatar-color-11{color:var(--avatar-color-11);fill:var(--avatar-color-11)}.avatar-color-12{color:var(--avatar-color-12);fill:var(--avatar-color-12)}.avatar-color-13{color:var(--avatar-color-13);fill:var(--avatar-color-13)}.avatar-color-14{color:var(--avatar-color-14);fill:var(--avatar-color-14)}.avatar-color-15{color:var(--avatar-color-15);fill:var(--avatar-color-15)}.avatar-color-16{color:var(--avatar-color-16);fill:var(--avatar-color-16)}.avatar-color-17{color:var(--avatar-color-17);fill:var(--avatar-color-17)}.avatar-color-18{color:var(--avatar-color-18);fill:var(--avatar-color-18)}.avatar-color-19{color:var(--avatar-color-19);fill:var(--avatar-color-19)}.avatar-color-20{color:var(--avatar-color-20);fill:var(--avatar-color-20)}.avatar-color-21{color:var(--avatar-color-21);fill:var(--avatar-color-21)}.avatar-color-22{color:var(--avatar-color-22);fill:var(--avatar-color-22)}.avatar-color-23{color:var(--avatar-color-23);fill:var(--avatar-color-23)}.avatar-color-24{color:var(--avatar-color-24);fill:var(--avatar-color-24)}.avatar-color-25{color:var(--avatar-color-25);fill:var(--avatar-color-25)}.avatar-color-26{color:var(--avatar-color-26);fill:var(--avatar-color-26)}.avatar-color-27{color:var(--avatar-color-27);fill:var(--avatar-color-27)}.avatar-color-28{color:var(--avatar-color-28);fill:var(--avatar-color-28)}.avatar-color-29{color:var(--avatar-color-29);fill:var(--avatar-color-29)}:root{--level-default-gradient: linear-gradient(135deg, #1282b8, #009655);--level-test-gradient: linear-gradient(135deg, #e98913, #f7b52c);--level-prime-gradient: linear-gradient(135deg, #1c1887, #5f1985);--level-admin-gradient: linear-gradient(135deg, #5c1c24, #e5757e)}:root{--brand-color-vitool: #ad78eb;--brand-gradient-start-vitool: #8a56dd;--brand-gradient-end-vitool: #af80d2;--brand-gradient-vitool: linear-gradient( to top, var(--brand-gradient-start-vitool), var(--brand-gradient-end-vitool) );--brand-border-vitool: #7549bc;--brand-color-wall: #a35490;--brand-gradient-start-wall: #843d79;--brand-gradient-end-wall: #c46ea9;--brand-gradient-wall: linear-gradient(to top, var(--brand-gradient-start-wall), var(--brand-gradient-end-wall));--brand-border-wall: #683060;--brand-color-stasign: #8787eb;--brand-gradient-start-stasign: #7146c2;--brand-gradient-end-stasign: #92a6fc;--brand-gradient-stasign: linear-gradient( to top, var(--brand-gradient-start-stasign), var(--brand-gradient-end-stasign) );--brand-border-stasign: #5442ab;--brand-color-staline: #66a1c8;--brand-gradient-start-staline: #3a6894;--brand-gradient-end-staline: #84c2db;--brand-gradient-staline: linear-gradient( to top, var(--brand-gradient-start-staline), var(--brand-gradient-end-staline) );--brand-border-staline: #30587d;--brand-color-project: #67caae;--brand-gradient-start-project: #43b1a2;--brand-gradient-end-project: #8fdeb2;--brand-gradient-project: linear-gradient( to top, var(--brand-gradient-start-project), var(--brand-gradient-end-project) );--brand-border-project: #399c8f;--brand-color-admin: #475569;--brand-gradient-start-admin: #334155;--brand-gradient-end-admin: #64748b;--brand-gradient-admin: linear-gradient(to top, var(--brand-gradient-start-admin), var(--brand-gradient-end-admin));--brand-border-admin: #1e293b;--brand-gradient-start-appname: var(--brand-gradient-start-vitool);--brand-gradient-end-appname: var(--brand-gradient-end-vitool);--brand-gradient-appname: linear-gradient( to top, var(--brand-gradient-start-appname), var(--brand-gradient-end-appname) );--brand-border-appname: var(--brand-border-vitool)}html[data-app=wall]{--brand-gradient-start-appname: var(--brand-gradient-start-wall);--brand-gradient-end-appname: var(--brand-gradient-end-wall);--brand-border-appname: var(--brand-border-wall)}html[data-app=stasign]{--brand-gradient-start-appname: var(--brand-gradient-start-stasign);--brand-gradient-end-appname: var(--brand-gradient-end-stasign);--brand-border-appname: var(--brand-border-stasign)}html[data-app=staline]{--brand-gradient-start-appname: var(--brand-gradient-start-staline);--brand-gradient-end-appname: var(--brand-gradient-end-staline);--brand-border-appname: var(--brand-border-staline)}html[data-app=project]{--brand-gradient-start-appname: var(--brand-gradient-start-project);--brand-gradient-end-appname: var(--brand-gradient-end-project);--brand-border-appname: var(--brand-border-project)}html[data-app=admin]{--brand-gradient-start-appname: var(--brand-gradient-start-admin);--brand-gradient-end-appname: var(--brand-gradient-end-admin);--brand-border-appname: var(--brand-border-admin)}';/*!
 * CGo UI — 主题引擎（明暗切换 + iframe 同步）
 * 移植自 cgoui/cgo_theme.js，保持完全一致的行为：
 *   - data-theme 属性应用到 <html>
 *   - 顶层窗口向所有 iframe 广播主题；子窗口监听 message 同步
 *   - localStorage 按工具前缀隔离；宿主可通过配置处理嵌入式页面
 *   - 系统主题变化在未手动设置时跟随
 */const kr=["vitool","wall","stasign","staline","project","cgoauth","mc","enmap","guide","timetable"];function $r(){let r="";try{const e=window.location.pathname,t=e.split("/").pop().replace(".html","");if((t==="index"||t==="real")&&(e.includes("/scmap")||e.includes("/scmap_original")||e.includes("/scmap_test")))return"scmap_app-theme";kr.includes(t)&&(r=t+"_")}catch{}return r+"app-theme"}let B=$r();function _r(r){r&&(B=r)}function Mr(){return B}function M(r){document.documentElement.setAttribute("data-theme",r),document.querySelectorAll("cgo-theme-toggle").forEach(e=>e._sync&&e._sync(r)),It(r),window.self===window.top&&document.querySelectorAll("iframe").forEach(e=>{try{e.contentWindow&&e.contentWindow.postMessage({type:"theme-change",theme:r},"*")}catch{}})}function We(){return document.documentElement.getAttribute("data-theme")||"light"}function Pt(){const r=We()==="dark"?"light":"dark";return localStorage.setItem(B,r),M(r),r}function Lt(){localStorage.removeItem(B);const r=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";return M(r),r}function Er(){let r=!1;const e=typeof window<"u"&&window.CGoUIConfig?window.CGoUIConfig:{};try{const t=e.embed||{};t.hideHeader===!0&&(r=!0),t.queryParam&&t.queryValue&&new URLSearchParams(window.location.search).get(t.queryParam)===t.queryValue&&(r=!0)}catch{}try{typeof e.shouldHideHeader=="function"&&e.shouldHideHeader({window})&&(r=!0)}catch{}if(r){const t=document.createElement("style");t.innerText=".tool-header, .bottom-bar, .status-bar { display: none !important; }",document.head.appendChild(t),document.documentElement.classList.add("is-iframe-vitool-hidden")}}function Sr(){if(window.addEventListener("message",r=>{r.data&&r.data.type==="theme-change"&&M(r.data.theme)}),window.self!==window.top)try{const r=window.parent.document.documentElement.getAttribute("data-theme");r&&setTimeout(()=>M(r),50)}catch{try{window.parent.postMessage({type:"theme-request"},"*")}catch{}}}const Zr=zr(),Ar=Cr();function zr(){return'<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>'}function Cr(){return'<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>'}function It(r){const e=document.getElementById("theme-toggle-btn");if(!e)return;const t=e.querySelector(".btn-icon");t&&(t.innerHTML=r==="dark"?Ar:Zr)}function Tr(){const r=document.getElementById("theme-toggle-btn");if(!r||r._cgoThemeBound)return;r._cgoThemeBound=!0,It(We());let e=null,t=!1;r.addEventListener("pointerdown",i=>{i.button!==0&&i.pointerType==="mouse"||(t=!1,e=setTimeout(()=>{t=!0,Lt(),navigator.vibrate&&navigator.vibrate(50)},800))});const o=()=>{e&&(clearTimeout(e),e=null)};r.addEventListener("pointerup",o),r.addEventListener("pointerleave",o),r.addEventListener("pointercancel",o),r.oncontextmenu=i=>(i.preventDefault(),i.stopPropagation(),!1),r.addEventListener("click",i=>{if(t){i.preventDefault(),i.stopPropagation(),t=!1;return}Pt()})}let ft=!1,ne=null;function Hr(){let r="";try{if(typeof window<"u"&&window.location&&window.location.pathname){const t=window.location.pathname.replace(/\.html$/,"").replace(/\/index$/,"").replace(/^\//,"").replace(/\/$/,"");r=t?t.replace(/[^a-zA-Z0-9_-]/g,"_")+"_":"root_"}}catch{}return r+"cgo_theme_color_config"}let W=Hr();function fe(r){r&&(W=r)}function ge(){return W}function Pr(r){if(!r||typeof r!="string")return null;let e=r.trim().replace(/^#/,"");if(e.length===4)e=e.slice(0,3);if(e.length===8)e=e.slice(0,6);if(e.length===3)e=e.split("").map(o=>o+o).join("");if(e.length!==6)return null;const t=parseInt(e,16);return[t>>16&255,t>>8&255,t&255]}function Lr(r,e,t){r/=255,e/=255,t/=255;const o=Math.max(r,e,t),i=Math.min(r,e,t);let a=0,n=0,c=(o+i)/2;if(o!==i){const s=o-i;switch(n=c>.5?s/(2-o-i):s/(o+i),o){case r:a=(e-t)/s+(e<t?6:0);break;case e:a=(t-r)/s+2;break;case t:a=(r-e)/s+4;break}a/=6}return[Math.round(a*360),Math.round(n*100),Math.round(c*100)]}function E(r,e,t){r=(r%360+360)%360,e=Math.max(0,Math.min(100,e))/100,t=Math.max(0,Math.min(100,t))/100;const o=(1-Math.abs(2*t-1))*e,i=o*(1-Math.abs(r/60%2-1)),a=t-o/2;let n=0,c=0,s=0;r<60?(n=o,c=i,s=0):r<120?(n=i,c=o,s=0):r<180?(n=0,c=o,s=i):r<240?(n=0,c=i,s=o):r<300?(n=i,c=0,s=o):(n=o,c=0,s=i);const p=f=>Math.round((f+a)*255).toString(16).padStart(2,"0");return`#${p(n)}${p(c)}${p(s)}`}function te(r){if(!r)return null;const e=Pr(r);if(!e)return null;const[t,o,i]=Lr(...e);if(r.toLowerCase()==="#00263b")return{primary:"#00263b",primaryHover:"#004060",darkPrimary:"#006098",darkPrimaryHover:"#0070b0",textMain:"#00263b",darkTextMain:"#e5e8ea",textLight:"#636f75",darkTextLight:"#a0b0b9"};let a;i>48?a=Math.max(30,Math.min(38,Math.round(i*.62))):a=Math.min(48,Math.max(32,i));const n=Math.min(98,Math.max(60,o)),c=E(t,n,a),s=Math.max(24,a-7),p=E(t,n,s),f=Math.min(62,Math.max(45,i>48?i*.8:a+12)),l=Math.min(98,Math.max(65,o)),g=E(t,l,f),h=Math.min(72,f+8),u=E(t,l,h),x=Math.min(100,Math.max(50,o)),y=E(t,x,11),$=Math.min(22,Math.max(8,Math.round(o*.2))),I=E(t,$,91),ce=Math.min(30,Math.max(12,Math.round(o*.3))),G=E(t,ce,42),J=Math.min(25,Math.max(10,Math.round(o*.25))),_=E(t,J,72);return{primary:c,primaryHover:p,darkPrimary:g,darkPrimaryHover:u,textMain:y,darkTextMain:I,textLight:G,darkTextLight:_}}function re(r,e={}){if(!r)return oe(),null;const t=te(r);if(!t)return console.warn("[CGoUI Theme] Invalid base color provided:",r),null;const o={...t,...e};ne={baseColor:r,overrides:e,palette:o};try{localStorage.setItem(W,JSON.stringify(ne))}catch{}return Ir(o),o}function oe(){ne=null;try{localStorage.removeItem(W)}catch{}const r=document.getElementById("cgo-theme-color-style");r&&r.parentNode&&r.parentNode.removeChild(r)}function ue(){return ne}function Ir(r){if(typeof document>"u")return;let e=document.getElementById("cgo-theme-color-style");e||(e=document.createElement("style"),e.id="cgo-theme-color-style",document.head.appendChild(e)),e.textContent=`
:root {
  --primary-color: ${r.primary};
  --primary-hover: ${r.primaryHover};
  --text-main: ${r.textMain};
  --text-light: ${r.textLight};
  --text-color: var(--text-main);
  --table-head-text: ${r.textMain};
}
[data-theme='dark'] {
  --primary-color: ${r.darkPrimary};
  --primary-hover: ${r.darkPrimaryHover};
  --text-main: ${r.darkTextMain||r.textMain};
  --text-light: ${r.darkTextLight};
  --table-head-text: ${r.darkTextMain||r.textMain};
}
`}function applyCityTheme(r){if(!r){resetCityTheme();return null;}const t=typeof r==="string"?te(r):{...te(r.primary||r.color),...r};if(!t)return null;const rgb=Pr(t.primary)||[202,34,35];const darkRgb=Pr(t.darkPrimary)||rgb;if(typeof document>"u")return t;let e=document.getElementById("cgo-city-theme-style");e||(e=document.createElement("style"),e.id="cgo-city-theme-style",document.head.appendChild(e));e.textContent=`
:root {
  --primary-color: ${t.primary};
  --primary-hover: ${t.primaryHover};
  --primary-rgb: ${rgb[0]}, ${rgb[1]}, ${rgb[2]};
}
[data-theme='dark'] {
  --primary-color: ${t.darkPrimary};
  --primary-hover: ${t.darkPrimaryHover};
  --primary-rgb: ${darkRgb[0]}, ${darkRgb[1]}, ${darkRgb[2]};
}
`;return t;}function resetCityTheme(){if(typeof document>"u")return;const e=document.getElementById("cgo-city-theme-style");e&&e.parentNode&&e.parentNode.removeChild(e);}function syncCityTheme(){if(typeof window<"u"){const isMapPage=Boolean(window.location.pathname.includes('main.html')||document.getElementById('map-container'));if(!isMapPage){resetCityTheme();return;}if(window.CityDataManager&&typeof window.CityDataManager.getCurrentCity==="function"){const c=window.CityDataManager.getCurrentCity();if(c&&c.themeColor){applyCityTheme(c.themeColor);return;}}resetCityTheme();}}function Nr(){if(ft)return;ft=!0;try{if(typeof document<"u"&&!document.getElementById("cgo-clr-style")){const t=document.createElement("style");t.id="cgo-clr-style",t.textContent=wr,document.head.prepend(t)}}catch(t){console.warn("Failed to auto-inject cgo_clr.css:",t)}Er(),Sr();const r=window.matchMedia("(prefers-color-scheme: dark)");M(localStorage.getItem(B)||(r.matches?"dark":"light")),r.addEventListener("change",t=>{localStorage.getItem(B)||M(t.matches?"dark":"light")});try{const isMapPage=typeof window<"u"&&Boolean(window.location.pathname.includes('main.html')||document.getElementById('map-container'));if(!isMapPage){const t=localStorage.getItem(W);if(t){const o=JSON.parse(t);o&&o.baseColor&&re(o.baseColor,o.overrides||{})}}}catch{}syncCityTheme();if(typeof window<"u"){window.addEventListener("cgo-city-change",()=>syncCityTheme());if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",()=>syncCityTheme())}}}class je extends b{constructor(){super();v(this,"_start",t=>{t.button!==0&&t.pointerType==="mouse"||(this._isLongPress=!1,this._pressTimer=setTimeout(()=>{this._isLongPress=!0,Lt(),this._showTip("已恢复系统明暗模式"),navigator.vibrate&&navigator.vibrate(50)},800))});v(this,"_cancel",()=>{this._pressTimer&&(clearTimeout(this._pressTimer),this._pressTimer=null)});v(this,"_click",t=>{if(this._isLongPress){t.preventDefault(),t.stopPropagation(),this._isLongPress=!1;return}Pt()});this.storageKey="",this._theme=We(),this._tip="",this._pressTimer=null,this._isLongPress=!1}connectedCallback(){super.connectedCallback(),this.storageKey&&_r(this.storageKey)}_sync(t){this._theme=t}_showTip(t){this._tip=t,this.requestUpdate(),clearTimeout(this._tipTimer),this._tipTimer=setTimeout(()=>{this._tip=""},2e3)}render(){const t=this._theme==="dark"?k.moon.d:k.sun.d,o=document.createElement("template");return o.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${t}</svg>`,d`
            <button
                title="切换明暗 · 长按恢复系统"
                @pointerdown=${this._start}
                @pointerup=${this._cancel}
                @pointerleave=${this._cancel}
                @pointercancel=${this._cancel}
                @click=${this._click}
                @contextmenu=${i=>{i.preventDefault(),i.stopPropagation()}}
            >
                ${o.content.cloneNode(!0)}
            </button>
            ${this._tip?d`
                      <div class="tip show">${this._tip}</div>
                  `:null}
        `}}v(je,"properties",{storageKey:{type:String,attribute:"storage-key"},_theme:{state:!0},_tip:{state:!0}}),v(je,"styles",m`
        :host {
            display: inline-flex;
        }
        button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            padding: 0;
            border-radius: var(--radius-xs, 4px);
            border: 1px solid var(--border-color, #dee2e6);
            background: var(--btn-info-bg, #f1f3f5);
            color: var(--text-main, #00263b);
            cursor: pointer;
            transition: all var(--transition-base, 0.2s ease);
            -webkit-tap-highlight-color: transparent;
        }
        button:hover {
            background: var(--btn-info-hover, #e9ecef);
        }
        svg {
            width: 20px;
            height: 20px;
            fill: currentColor;
            pointer-events: none;
        }
        .tip {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(-10px);
            background: rgba(0, 0, 0, 0.82);
            color: #fff;
            padding: 8px 16px;
            border-radius: var(--radius-full, 9999px);
            font-size: 13px;
            pointer-events: none;
            z-index: 11000;
            opacity: 0;
            transition: all 0.3s ease;
            white-space: nowrap;
            box-shadow: var(--shadow-md, 0 4px 15px rgba(0, 0, 0, 0.08));
        }
        .tip.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-theme-toggle")||customElements.define("cgo-theme-toggle",je));class Ue extends b{constructor(){super(),this.icon="",this.label="",this.target="",this.active=!1,this.danger=!1,this.heading=!1,this.tag="",this.wrap=!1}}v(Ue,"properties",{icon:{type:String},label:{type:String},target:{type:String},active:{type:Boolean,reflect:!0},danger:{type:Boolean,reflect:!0},heading:{type:Boolean,reflect:!0},tag:{type:String},wrap:{type:Boolean,reflect:!0}}),v(Ue,"styles",m`
        :host {
            display: contents;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-nav-item")||customElements.define("cgo-nav-item",Ue));class De extends b{constructor(){super(),this.activeIndex=0,this._lastItemsLen=0}get _items(){return[...this.querySelectorAll("cgo-nav-item")]}get _clickableItems(){return this._items.filter(e=>!e.heading)}select(e){const t=this._clickableItems;if(e<0||e>=t.length)return;this.activeIndex=e,t.forEach((i,a)=>{i.active=a===e});const o=t[e];this.dispatchEvent(new CustomEvent("cgo-nav-change",{detail:{index:e,target:o.target,item:o},bubbles:!0,composed:!0}))}selectByTarget(e){const o=this._clickableItems.findIndex(i=>i.target===e);o>=0&&this.select(o)}updated(e){const t=this._items.length;t!==this._lastItemsLen&&(this._lastItemsLen=t,this._initActive())}_initActive(){const e=this._clickableItems;if(e.length===0)return;const t=e.findIndex(o=>o.active);t>=0?this.activeIndex=t:(e[0].active=!0,this.activeIndex=0)}render(){const e=this._items;let t=0;const o=e.map((i,a)=>{const n=i.icon,c=i.label,s=i.danger,p=i.heading,f=i.active,l=i.tag;if(p)return d`
                    <div class="sidenav-heading">
                        ${n?d`
                                  <span class="sidenav-heading-icon">${n}</span>
                              `:null}
                        <span>${c}</span>
                    </div>
                `;const g=t++,h=i.wrap?" wrap":"";return d`
                <button
                    class="sidenav-item ${f?"active":""} ${s?"danger":""}${h}"
                    @click=${()=>this.select(g)}
                    type="button"
                >
                    ${n?d`
                              <cgo-icon name=${n} size="18"></cgo-icon>
                          `:null}
                    <span class="sidenav-item-label">
                        ${c||d`
                            <slot name="item-${a}"></slot>
                        `}
                    </span>
                    ${l?d`
                              <code class="sidenav-item-tag">${l}</code>
                          `:null}
                </button>
            `});return d`
            <div class="sidenav">
                ${this._hasSlot("user-brief")?d`
                          <div class="sidenav-user-brief">
                              <slot name="user-brief" @slotchange=${()=>this.requestUpdate()}></slot>
                          </div>
                      `:null}

                <nav class="sidenav-menu">${o}</nav>

                ${this._hasSlot("footer")?d`
                          <div class="sidenav-footer">
                              <slot name="footer" @slotchange=${()=>this.requestUpdate()}></slot>
                          </div>
                      `:null}
            </div>
        `}_hasSlot(e){return this.querySelector(`[slot="${e}"]`)!==null}}v(De,"properties",{activeIndex:{type:Number,attribute:"active-index"}}),v(De,"styles",m`
        :host {
            /* ---- CSS 变量（可按需覆写） ---- */
            --sidenav-width: 220px;
            --sidenav-bg: var(--glass-bg, rgba(248, 249, 250, 0.85));
            --sidenav-border: var(--glass-border, rgba(0, 0, 0, 0.08));
            --sidenav-item-gap: 4px;
            --sidenav-item-radius: 6px;
            --sidenav-item-px: 12px;
            --sidenav-item-py: 10px;
            --sidenav-active-bg: var(--primary-color, #006098);
            --sidenav-active-fg: var(--btn-text, #fff);
            --sidenav-active-border-left: transparent;
            --sidenav-danger-bg: var(--danger-color, #dc3545);
            --sidenav-danger-fg: #fff;
            --sidenav-user-brief-border: var(--glass-border, rgba(0, 0, 0, 0.08));
            --sidenav-footer-border: var(--glass-border, rgba(0, 0, 0, 0.08));

            display: block;
            font-family: var(--font-sans, system-ui, -apple-system, 'Noto Sans SC', sans-serif);
        }

        /* ===== 外层容器 ===== */
        .sidenav {
            display: flex;
            flex-direction: column;
            width: var(--sidenav-width);
            height: 100%;
            background: var(--sidenav-bg);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-right: 1px solid var(--sidenav-border);
            box-sizing: border-box;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        }

        /* ===== 用户简介区 ===== */
        .sidenav-user-brief {
            padding: 20px 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            border-bottom: 1px solid var(--sidenav-user-brief-border);
        }

        /* ===== 导航列表 ===== */
        .sidenav-menu {
            flex: 1;
            overflow-y: auto;
            padding: 24px 10px 10px;
            display: flex;
            flex-direction: column;
            gap: var(--sidenav-item-gap);
            scrollbar-width: thin;
        }

        /* ===== 侧边栏底部插槽 ===== */
        .sidenav-footer {
            padding: 16px;
            border-top: 1px solid var(--sidenav-footer-border);
        }

        /* ===== 分组标题（不可点击） ===== */
        .sidenav-heading {
            padding: 12px var(--sidenav-item-px) 4px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: var(--text-light, #64748b);
            text-transform: uppercase;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .sidenav-heading:first-child {
            padding-top: 0;
        }
        .sidenav-heading-icon {
            font-size: 13px;
            line-height: 1;
        }

        /* ===== PC 端导航项 ===== */
        .sidenav-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: var(--sidenav-item-py) var(--sidenav-item-px);
            border-radius: var(--sidenav-item-radius);
            border: none;
            color: var(--text-light, #64748b);
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 0.9rem;
            background: none;
            width: 100%;
            text-align: left;
            font-family: inherit;
            line-height: 1.4;
            box-sizing: border-box;
            white-space: nowrap;
        }
        .sidenav-item:hover {
            background-color: var(--btn-info-bg, #f1f3f5);
            color: var(--text-main, #102033);
        }
        .sidenav-item.active {
            background-color: var(--sidenav-active-bg);
            color: var(--sidenav-active-fg);
        }
        .sidenav-item.active .sidenav-item-tag {
            color: var(--sidenav-active-fg);
        }
        .sidenav-item.active cgo-icon {
            color: var(--sidenav-active-fg);
        }
        .sidenav-item.danger {
            color: var(--danger-color, #dc3545);
        }
        .sidenav-item.danger:hover {
            background-color: rgba(217, 48, 37, 0.1);
            color: var(--danger-color, #dc3545);
        }
        .sidenav-item.danger.active {
            background-color: var(--sidenav-danger-bg);
            color: var(--sidenav-danger-fg);
        }

        /* 标签文本 */
        .sidenav-item-label {
            flex: 1;
            min-width: 0;
        }

        /* 右侧代码标签 */
        .sidenav-item-tag {
            font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
            font-size: 11px;
            color: var(--text-light, #64748b);
            margin-left: auto;
            flex-shrink: 0;
            font-weight: 400;
        }

        /* tag 换行变体 */
        .sidenav-item.wrap {
            flex-wrap: wrap;
            white-space: normal;
            align-items: flex-start;
        }
        .sidenav-item.wrap .sidenav-item-label {
            flex: 0 0 100%;
        }
        .sidenav-item.wrap .sidenav-item-tag {
            margin-left: 0;
            width: 100%;
        }

        /* ===== 移动端胶囊样式 ===== */
        .sidenav-capsules {
            display: none;
        }

        /* ============================================
           响应式：≤820px 切换为顶部胶囊选项卡
           ============================================ */
        @media (max-width: 820px) {
            .sidenav {
                width: 100%;
                height: auto;
                flex-direction: row;
                align-items: center;
                border-right: none;
                border-bottom: 1px solid var(--border-color, #dee2e6);
                background: var(--card-bg, #fff);
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                padding: 0;
                flex-shrink: 0;
            }
            .sidenav-user-brief,
            .sidenav-footer,
            .sidenav-heading {
                display: none;
            }
            .sidenav-menu {
                flex-direction: row;
                padding: 10px 12px;
                overflow-x: auto;
                overflow-y: hidden;
                white-space: nowrap;
                -webkit-overflow-scrolling: touch;
                gap: 8px;
                scrollbar-width: none;
            }
            .sidenav-menu::-webkit-scrollbar {
                display: none;
            }

            /* 移动端选项卡 */
            .sidenav-item {
                flex-shrink: 0;
                flex-direction: row;
                align-items: center;
                gap: 6px;
                padding: 8px 14px;
                margin: 0;
                border-radius: var(--sidenav-item-radius, 6px);
                font-size: 0.85rem;
                width: auto;
                background-color: transparent;
                color: var(--text-light, #64748b);
            }
            .sidenav-item:hover {
                background-color: transparent;
            }
            .sidenav-item.active {
                background-color: var(--sidenav-active-bg);
                color: var(--sidenav-active-fg);
            }
            .sidenav-item.danger {
                color: var(--danger-color, #dc3545);
                background-color: var(--btn-info-bg, #f1f3f5);
            }
            .sidenav-item.danger.active {
                background-color: var(--sidenav-danger-bg);
                color: var(--sidenav-danger-fg);
            }
            .sidenav-item-tag {
                display: none;
            }
            .sidenav-item cgo-icon {
                width: 16px;
                height: 16px;
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-side-nav")||customElements.define("cgo-side-nav",De));/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class Ve extends At{constructor(e){if(super(e),this.it=w,e.type!==St.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===w||e==null)return this._t=void 0,this.it=e;if(e===A)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}Ve.directiveName="unsafeHTML",Ve.resultType=1;const Or=Zt(Ve),Q=new Set;class Re extends b{constructor(){super(),this.value="",this.placeholder="",this.open=!1,this.openUp=!1,this.disabled=!1,this._label="",this._onOutside=this._onOutside.bind(this),this._positionHandler=()=>{this.open&&this._positionOptions()}}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._onOutside),this._syncThemeToHost(),this._themeObserver=new MutationObserver(()=>this._syncThemeToHost()),this._themeObserver.observe(document.documentElement,{attributes:!0,attributeFilter:["data-theme"]}),requestAnimationFrame(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onOutside),window.removeEventListener("resize",this._positionHandler),window.removeEventListener("scroll",this._positionHandler,!0),Q.delete(this),this._themeObserver&&(this._themeObserver.disconnect(),this._themeObserver=null)}_syncThemeToHost(){const e=document.documentElement.getAttribute("data-theme");e?this.setAttribute("data-theme",e):this.removeAttribute("data-theme")}_onOutside(e){this.contains(e.target)||this.close()}_getOptions(){return[...this.querySelectorAll("cgo-toolbar-option")]}_syncLabel(){const e=this._getOptions(),t=e.find(o=>o.getAttribute("value")===this.value);t?this._label=t.textContent.trim():!this.value&&e.length>0?this._label=e[0].textContent.trim():this._label=""}firstUpdated(){this._syncLabel()}updated(e){e.has("value")&&this._syncLabel()}_toggle(e){e.stopPropagation(),!this.disabled&&(this.open?this.close():this.show())}show(){Q.forEach(e=>{e!==this&&e.close()}),this.open=!0,Q.add(this),this._positionOptions(),window.addEventListener("resize",this._positionHandler),window.addEventListener("scroll",this._positionHandler,!0)}_positionOptions(){requestAnimationFrame(()=>{const e=this.shadowRoot.querySelector(".options"),t=this.shadowRoot.querySelector(".trigger");if(!e||!t)return;let o=null,i=this.parentNode;for(;i;){if(i instanceof ShadowRoot){i=i.host;continue}if(i===document.body||i===document.documentElement)break;const l=window.getComputedStyle(i);if(l.transform&&l.transform!=="none"||l.perspective&&l.perspective!=="none"||l.filter&&l.filter!=="none"||l.backdropFilter&&l.backdropFilter!=="none"){o=i;break}i=i.parentNode}const a=t.getBoundingClientRect(),n=a.width,c=o?o.getBoundingClientRect():{left:0,top:0,height:window.innerHeight},s=a.left-c.left;e.style.width=n+"px",e.style.left=s+"px",e.style.top="",e.style.bottom="";const p=a.bottom-c.top+5;a.bottom+5+Math.min(e.scrollHeight,300)>window.innerHeight-10?(this.openUp=!0,e.style.bottom=c.height-(a.top-c.top)+5+"px"):(this.openUp=!1,e.style.top=p+"px")})}close(){this.open&&(this.open=!1,Q.delete(this),window.removeEventListener("resize",this._positionHandler),window.removeEventListener("scroll",this._positionHandler,!0))}_select(e){if(this.value===e){this.close();return}this.value=e;const t=this._getOptions().find(i=>i.getAttribute("value")===e),o=t?t.textContent.trim():"";this.close(),this.dispatchEvent(new CustomEvent("cgo-change",{detail:{value:e,label:o},bubbles:!0,composed:!0}))}render(){const e=this._getOptions(),t=!this._label&&!!this.placeholder;return d`
            <button class="trigger" type="button" @click=${this._toggle}>
                <span class="text ${t?"placeholder":""}">${this._label||this.placeholder||""}</span>
                <svg
                    class="arrow"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="options">
                ${e.map(o=>{const i=o.getAttribute("value")||"",a=i===this.value;return d`
                        <div class="opt ${a?"selected":""}" @click=${()=>this._select(i)}>
                            ${Or(o.innerHTML)}
                        </div>
                    `})}
            </div>
            <div class="src"><slot></slot></div>
        `}}v(Re,"properties",{value:{type:String,reflect:!0},placeholder:{type:String},open:{type:Boolean,reflect:!0},openUp:{type:Boolean,reflect:!0,attribute:"open-up"},disabled:{type:Boolean,reflect:!0},_label:{type:String,state:!0}}),v(Re,"styles",m`
        :host {
            display: block;
            position: relative;
            width: 100%;
            font-family: var(--font-sans, system-ui, sans-serif);
        }

        .trigger {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            outline: none;
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            background: var(--input-bg, var(--bg-secondary, #f5f6f8));
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: 6px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 13px;
            font-family: var(--font-sans, system-ui, sans-serif);
            font-weight: 400;
            color: var(--text-main, #00263b);
            text-align: left;
            line-height: 1.6;
            user-select: none;
            min-height: 32px;
            box-sizing: border-box;
            transition: all 0.2s ease;
        }
        .trigger:hover {
            border-color: var(--primary-color, #006098);
        }

        :host([open]) .trigger {
            border-color: var(--primary-color, #006098);
            box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
        }

        :host([data-theme='dark']) .trigger {
            background: rgba(255, 255, 255, 0.03);
            border-color: rgba(255, 255, 255, 0.08);
        }

        .text {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
        }
        .placeholder {
            opacity: 0.5;
        }

        .arrow {
            width: 12px;
            height: 12px;
            opacity: 0.5;
            flex-shrink: 0;
            transition: transform 0.2s ease;
        }
        :host([open]) .arrow {
            transform: rotate(180deg);
        }

        :host([disabled]) .trigger {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .options {
            position: fixed;
            max-height: 300px;
            background: var(--panel-bg, #fff);
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 100;
            overflow-y: auto;
            display: none;
            padding: 6px;
            box-sizing: border-box;
        }
        :host([open]) .options {
            display: block;
        }
        /* position: fixed 下，宽度与位置由 JS 注入的内联样式控制 */
        :host([open-up]) .options {
            box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.15);
        }

        .opt {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            box-sizing: border-box;
            padding: 8px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            color: var(--text-main, #00263b);
            transition: background 0.15s;
            user-select: none;
            border: none;
            background: none;
            font-family: var(--font-sans, system-ui, sans-serif);
            text-align: left;
        }
        .opt:hover {
            background: var(--btn-info-hover, #e9ecef);
        }
        .opt.selected {
            background: var(--primary-color, #006098);
            color: #fff;
        }

        /* 选项内颜色圆点 / 图片 */
        .opt ::slotted(.cgo-toolbar-option-dot),
        .opt .cgo-toolbar-option-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .opt ::slotted(.cgo-toolbar-option-img),
        .opt .cgo-toolbar-option-img {
            height: 18px;
            width: auto;
            max-width: 42px;
            object-fit: contain;
            flex-shrink: 0;
        }

        :host([data-theme='dark']) .options {
            background: #2a2b2c;
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        :host([data-theme='dark'][open-up]) .options {
            box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.4);
        }

        .options::-webkit-scrollbar {
            width: 6px;
        }
        .options::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
        }
        :host([data-theme='dark']) .options::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
        }

        :host([open]:not([open-up])) .options {
            animation: cgoTsFadeIn 0.2s ease;
        }
        :host([open][open-up]) .options {
            animation: cgoTsFadeInUp 0.2s ease;
        }
        @keyframes cgoTsFadeIn {
            from {
                opacity: 0;
                transform: translateY(-5px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes cgoTsFadeInUp {
            from {
                opacity: 0;
                transform: translateY(5px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .src {
            display: none;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-toolbar-select")||customElements.define("cgo-toolbar-select",Re));const Br='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';class qe extends b{constructor(){super(),this.title="通知中心",this.items=[],this.muted=!1,this.maxHeight=""}_handleClear(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent("cgo-notice-clear",{bubbles:!0,composed:!0}))}_handleMuteToggle(e){e.stopPropagation(),this.muted=!this.muted,this.dispatchEvent(new CustomEvent("cgo-notice-mute-toggle",{bubbles:!0,composed:!0,detail:{muted:this.muted}}))}_handleItemAction(e,t){this.dispatchEvent(new CustomEvent("cgo-notice-action",{bubbles:!0,composed:!0,detail:{item:e,eventDetail:t.detail}}))}render(){const e=this.maxHeight?`--panel-max-height: ${this.maxHeight};`:"",t=Array.isArray(this.items)?this.items:[];return d`
            <div class="center-panel" style="${e}">
                <div class="panel-title">${this.title}</div>

                <div class="list-container">
                    ${t.length===0?d`
                        <div class="empty-tip">暂无通知公告</div>
                    `:t.map(o=>d`
                        <cgo-notice-card
                            category=${o.category||"software"}
                            notice-title=${o.title||""}
                            content=${o.content||""}
                            image-url=${o.imageUrl||o.image||""}
                            .actions=${o.actions||[]}
                            @cgo-notice-action=${i=>this._handleItemAction(o,i)}
                        ></cgo-notice-card>
                    `)}
                </div>

                <div class="panel-footer">
                    <button class="btn-clear" @click=${this._handleClear}>清除所有通知</button>
                    <button class="btn-mute ${this.muted?"is-active":""}" @click=${this._handleMuteToggle}>
                        <span .innerHTML=${Br}></span>
                        <span>${this.muted?"已静默":"免打扰"}</span>
                    </button>
                </div>
            </div>
        `}}v(qe,"properties",{title:{type:String},items:{type:Array,converter:e=>{if(!e)return[];if(Array.isArray(e))return e;try{return JSON.parse(e)}catch{return[]}}},muted:{type:Boolean,reflect:!0},maxHeight:{type:String,attribute:"max-height"}}),v(qe,"styles",m`
        :host {
            display: block;
            width: 100%;
            max-width: 320px;
            font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
            box-sizing: border-box;
        }

        .center-panel {
            width: 100%;
            background: var(--panel-bg, var(--card-bg, #ffffff));
            border-radius: var(--radius-md, 10px);
            border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
            box-shadow: var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.09));
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            padding: 12px 0 10px;
            max-height: var(--panel-max-height, 480px);
            overflow: hidden;
        }

        .panel-title {
            font-size: 13px;
            font-weight: 700;
            text-align: center;
            margin: 0;
            padding: 0 12px 8px;
            border-bottom: 2px solid var(--border-color, rgba(0, 0, 0, 0.12));
            color: var(--text-main, #00263b);
            flex-shrink: 0;
        }

        .list-container {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 10px 12px;
            min-height: 80px;
            background: var(--notice-center-list-bg, rgba(0, 0, 0, 0.035));
        }

        :host([data-theme='dark']) .list-container,
        :host-context([data-theme='dark']) .list-container {
            background: var(--notice-center-list-bg-dark, rgba(0, 0, 0, 0.32));
        }

        .empty-tip {
            text-align: center;
            font-size: 12px;
            color: var(--text-light, #888888);
            padding: 24px 10px;
        }

        .panel-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 0;
            padding: 8px 12px 0;
            border-top: 2px solid var(--border-color, rgba(0, 0, 0, 0.12));
            flex-shrink: 0;
        }

        .btn-clear {
            font-size: 11px;
            color: var(--text-light, #666666);
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: var(--radius-xs, 4px);
            transition: background 0.2s, color 0.2s;
        }

        .btn-clear:hover {
            background: var(--tab-hover, rgba(0, 0, 0, 0.06));
            color: var(--danger-color, #dc3545);
        }

        .btn-mute {
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 4px;
            color: var(--text-light, #666666);
            background: transparent;
            border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
            padding: 3px 8px;
            border-radius: var(--radius-xs, 4px);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-mute:hover {
            background: var(--tab-hover, rgba(0, 0, 0, 0.06));
            color: var(--text-main, #00263b);
        }

        .btn-mute.is-active {
            background: var(--info-bg, rgba(0, 133, 196, 0.1));
            color: var(--primary-color, #006098);
            border-color: var(--primary-color, #006098);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-notice-center")||customElements.define("cgo-notice-center",qe));/*!
 * CGo UI — window.CGO / window.ToolTheme 兼容垫片
 *
 * 目的：让 15 个仍在使用旧全局 API 的工具「一行不动也不会坏」。
 * 这里 1:1 重建 cgo_icons.js / cgo_ctrl.js / cgo_theme.js 暴露的全部 API，
 * 签名与行为保持一致；多数函数仍操作 light DOM + 仍加载的全局 CSS。
 */const ie=Object.freeze({branding:Object.freeze({copyright:"",links:[],beianPath:"",beianAlt:"备案图标"}),isEmbeddedApp:()=>!1});let Fe=ie;function jr(r={}){const e={...ie.branding,...r.branding||{}},t=Array.isArray(e.links)?e.links.filter(o=>o&&o.href):[];return Fe={...ie,...r,branding:{...e,links:t},isEmbeddedApp:typeof r.isEmbeddedApp=="function"?r.isEmbeddedApp:ie.isEmbeddedApp},Fe}function Nt(r){return r&&r.CGoUIConfig?jr(r.CGoUIConfig):Fe}function Ge(r,e){return Mt(r,e||{})}function Ur(r,e,t,o){t=t||"btn btn-info",o=o||"left";const i=Ge(e,{class:"btn-icon"}),a=r?"<span>"+T(r)+"</span>":"",n=o==="right"?a+i:i+a;return'<button class="'+t+'">'+n+"</button>"}function gt(r){r=r||document.body,r.querySelectorAll("[data-icon]").forEach(t=>{if(t.dataset.iconRendered)return;const o=t.dataset.icon,i=t.dataset.iconSize||20,a=t.dataset.iconClass||"btn-icon";t.innerHTML=Ge(o,{size:i,class:a}),t.dataset.iconRendered="1"})}function Dr(){if(document.getElementById("cgo-icon-sprite"))return;let r="";Object.keys(k).forEach(t=>{const o=k[t],i=o.type==="stroke"?"none":"currentColor";r+='<symbol id="cgo-icon-'+t+'" viewBox="'+(o.viewBox||"0 0 24 24")+'" fill="'+i+'"'+(o.type==="stroke"?' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"':"")+">"+o.d+"</symbol>"});const e=document.createElementNS("http://www.w3.org/2000/svg","svg");e.setAttribute("id","cgo-icon-sprite"),e.setAttribute("aria-hidden","true"),e.style.cssText="position:absolute;width:0;height:0;overflow:hidden;",e.innerHTML="<defs>"+r+"</defs>",document.body.insertBefore(e,document.body.firstChild)}function Vr(r,e){e=e||{};const t=e.size!==void 0?e.size:20,o=typeof t=="number"?t+"px":t,i=k[r];return'<svg class="'+("cgo-svg-icon"+(i&&i.type==="stroke"?" cgo-stroke-icon":"")+(e.class?" "+e.class:""))+'" xmlns="http://www.w3.org/2000/svg" width="'+o+'" height="'+o+'" aria-hidden="true"><use href="#cgo-icon-'+r+'"/></svg>'}function ut(r,e){r.querySelectorAll(".dropdown-content.show").forEach(t=>{t!==e&&t.classList.remove("show")})}function bt(r){r=r||document,r.querySelectorAll(".dropdown").forEach(e=>{const t=e.querySelector(".dropbtn"),o=e.querySelector(".dropdown-content");!t||!o||t._cgoBound||(t._cgoBound=!0,t.addEventListener("click",i=>{i.stopPropagation();const a=!o.classList.contains("show");ut(r instanceof Document?document.body:r),a&&o.classList.add("show")}),o.querySelectorAll("a, button").forEach(i=>{i.addEventListener("click",a=>{a.stopPropagation(),o.classList.remove("show")})}))}),r._cgoDropdownOutsideInit||(r._cgoDropdownOutsideInit=!0,(r instanceof Document?document:r).addEventListener("click",()=>ut(r instanceof Document?document.body:r)))}function Ot(r){const e=r?"Appearance":"界面外观",t=r?"Dark or light UI style":"软件界面的深色或浅色风格",o=r?"System":"跟随系统",i=r?"Light":"亮色",a=r?"Dark":"暗色";return'<div class="help-setting-row"><div><h4>'+e+"</h4><p>"+t+'</p></div><div style="min-width:120px"><cgo-toolbar-select id="js-theme-select"><cgo-toolbar-option value="system">'+o+'</cgo-toolbar-option><cgo-toolbar-option value="light">'+i+'</cgo-toolbar-option><cgo-toolbar-option value="dark">'+a+"</cgo-toolbar-option></cgo-toolbar-select></div></div>"}function Bt(r){if(!r)return;const e=Mr(),t=localStorage.getItem(e),o=t==="light"?"light":t==="dark"?"dark":"system";r.setAttribute("value",o),r.addEventListener("cgo-change",i=>{const a=i.detail.value;a==="system"?(localStorage.removeItem(e),M(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")):(localStorage.setItem(e,a),M(a))})}function Rr(r){console.log("[HelpModal] showHelpModal entry called, options:",r),r=r||{};const e=r.title||"帮助与选项",t=r.subtitle||"",o=Nt(typeof window<"u"?window:void 0),i={...o.branding,...r.branding||{}},a=r.iconPath?'<img src="'+r.iconPath+'" class="help-icon-img" alt="Logo">':"",n=r.beianPath||i.beianPath,c=r.content||"",s=r.maxWidth||"420px",p=!!r.isEnglish,f=r.isEmbedded===!0||o.isEmbeddedApp({options:r,global:window}),l=r.hideTheme||f?"":Ot(p),g=document.createElement("div");g.className="help-overlay";const h=document.createElement("div");h.className="text-dialog help-dialog",h.style.maxWidth=s;const u=document.createElement("button");u.className="dialog-close-btn",u.innerHTML="&times;";const x=document.createElement("div");x.className="help-container";const y='<div class="help-header">'+a+'<div class="help-title-group"><h3>'+e+"</h3>"+(t?"<p>"+t+"</p>":"")+"</div></div>",$=Array.isArray(i.links)?i.links.filter(_=>_&&_.href&&_.label).map(_=>'<a href="'+T(_.href)+'" target="_blank" rel="noopener noreferrer">'+T(_.label)+"</a>").join(""):"",I=n?'<div class="help-beian-group"><img src="'+T(n)+'" alt="'+T(i.beianAlt||"备案图标")+'" class="help-beian-icon"></div>':"",ce=i.copyright||$||I?'<div class="help-footer"><div class="help-footer-content">'+(i.copyright?"<span>"+T(i.copyright)+"</span>":"")+$+I+"</div></div>":"";x.innerHTML=y+l+c+ce,h.appendChild(u),h.appendChild(x),document.body.appendChild(g),document.body.appendChild(h),g.style.opacity="1",h.style.opacity="1",h.style.transform="translate(-50%, -50%)";const G=h.querySelector("#js-theme-select");G&&Bt(G);const J=_=>{console.log("[HelpModal] close called, reason:",_,"stack:",new Error().stack),g.parentNode&&g.parentNode.removeChild(g),h.parentNode&&h.parentNode.removeChild(h)};u.addEventListener("click",()=>J("closeBtn click")),setTimeout(()=>{g.addEventListener("click",_=>{_.target===g&&J("overlay click")})},100)}function qr(r,e,t){t=t||{};const o=typeof t.duration=="number"?t.duration:8e3,i=t.zoomClass||"auth-captcha-zoomed",a=typeof r=="string"?document.querySelector(r):r,n=typeof e=="string"?document.querySelector(e):e;if(!a||!n)return null;let c=null;const s=()=>{n.classList.remove(i),c&&(clearTimeout(c),c=null)},p=f=>{f.stopPropagation(),n.classList.contains(i)?s():(n.classList.add(i),c&&clearTimeout(c),c=setTimeout(s,o))};return a.addEventListener("click",p),{destroy:()=>{a.removeEventListener("click",p),s()},reset:s}}function Fr(r=window){Nt(r);const e=r.CGO||{};e.Icons=k,e.icon=Ge,e.iconBtn=Ur,e.renderIcons=gt,e.injectSprite=Dr,e.use=Vr,e.iconList=pr,e.initDropdowns=bt,e.getThemeSettingHTML=Ot,e.bindThemeSelect=Bt,e.showToast=Tt,e.showNoticePopup=zt,e.showHelpModal=Rr,e.generateCaptcha=Ht,e.bindCaptchaZoom=qr,e.theme={setThemeColor:re,resetThemeColor:oe,getThemeColor:ue,generateThemePalette:te,applyTheme:M,setThemeColorStorageKey:fe,getThemeColorStorageKey:ge,applyCityTheme:applyCityTheme,resetCityTheme:resetCityTheme,syncCityTheme:syncCityTheme},e.setThemeColor=re,e.resetThemeColor=oe,e.getThemeColor=ue,e.generateThemePalette=te,e.setThemeColorStorageKey=fe,e.getThemeColorStorageKey=ge,e.applyCityTheme=applyCityTheme,e.resetCityTheme=resetCityTheme,e.syncCityTheme=syncCityTheme,r.CGO=e,r.ToolTheme=r.ToolTheme||{},r.ToolTheme.applyTheme=M,r.ToolTheme.setThemeColor=re,r.ToolTheme.resetThemeColor=oe,r.ToolTheme.getThemeColor=ue,r.ToolTheme.generateThemePalette=te,r.ToolTheme.setThemeColorStorageKey=fe,r.ToolTheme.getThemeColorStorageKey=ge,r.ToolTheme.applyCityTheme=applyCityTheme,r.ToolTheme.resetCityTheme=resetCityTheme,r.ToolTheme.syncCityTheme=syncCityTheme;const t=()=>{gt(),bt(document),Tr()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t):t()}/*!
 * @cgo/ui — 浏览器 <script type="module"> 入口
 * 产物为 dist/cgo-ui.js，可被原生 HTML 通过 NPM 包或版本化 CDN 引入。
 *
 * 作用：
 *   1. 注册全部 <cgo-*> 自定义元素（来自 index.js 的副作用导入）
 *   2. 安装 window.CGO / window.ToolTheme 兼容垫片
 *   3. 立即初始化主题引擎（防闪烁）
 */Nr();Fr(window);
