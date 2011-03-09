//var $, scriptUrl, askbotSkin
var mediaUrl = function(resource){
    return scriptUrl + 'm/' + askbotSkin + '/' + resource;
};

var copyAltToTitle = function(sel){
    sel.attr('title', sel.attr('alt'));
};

var getUniqueWords = function(value){
    var words = $.trim(value).split(/\s+/);
    var uniques = new Object();
    var out = new Array();
    $.each(words, function(idx, item){
        if (!(item in uniques)){
            uniques[item] = 1;
            out.push(item);
        };
    });
    return out;
};

var showMessage = function(element, msg, where) {
    var div = $('<div class="vote-notification"><h3>' + msg + '</h3>(' +
    $.i18n._('click to close') + ')</div>');

    div.click(function(event) {
        $(".vote-notification").fadeOut("fast", function() { $(this).remove(); });
    });

    var where = where || 'parent';

    if (where == 'parent'){
        element.parent().append(div);
    }
    else {
        element.after(div);
    }

    div.fadeIn("fast");
};

//outer html hack - https://github.com/brandonaaron/jquery-outerhtml/
(function($){
    var div;
    $.fn.outerHTML = function() {
        var elem = this[0],
        tmp;
        return !elem ? null
        : typeof ( tmp = elem.outerHTML ) === 'string' ? tmp
        : ( div = div || $('<div/>') ).html( this.eq(0).clone() ).html();
    };
})(jQuery);

var makeKeyHandler = function(key, callback){
    return function(e){
        if ((e.which && e.which == key) || (e.keyCode && e.keyCode == key)){
            callback();
            return false;
        }
    };
};


var setupButtonEventHandlers = function(button, callback){
    button.keydown(makeKeyHandler(13, callback));
    button.click(callback);
};


var putCursorAtEnd = function(element){
    var el = element.get()[0];
    if (el.setSelectionRange){
        var len = element.val().length * 2;
        el.setSelectionRange(len, len);
    }
    else{
        element.val(element.val());
    }
    element.scrollTop = 999999;
};

var setCheckBoxesIn = function(selector, value){
    return $(selector + '> input[type=checkbox]').attr('checked', value);
};

var notify = function() {
    var visible = false;
    return {
        show: function(html) {
            if (html) {
                $("body").css("margin-top", "2.2em");
                $(".notify span").html(html);        
            }          
            $(".notify").fadeIn("slow");
            visible = true;
        },       
        close: function(doPostback) {
            if (doPostback) {
               $.post(
                   askbot['urls']['mark_read_message'],
                   { formdata: "required" }
               );
            }
            $(".notify").fadeOut("fast");
            $("body").css("margin-top", "0");
            visible = false;
        },     
        isVisible: function() { return visible; }     
    };
} ();

/* some google closure-like code for the ui elements */
var inherits = function(childCtor, parentCtor) {
  /** @constructor taken from google closure */
    function tempCtor() {};
    tempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new tempCtor();
    childCtor.prototype.constructor = childCtor;
};

/* wrapper around jQuery object */
var WrappedElement = function(){
    this._element = null;
    this._in_document = false;
};
WrappedElement.prototype.setElement = function(element){
    this._element = element;
};
WrappedElement.prototype.createDom = function(){
    this._element = $('<div></div>');
};
WrappedElement.prototype.getElement = function(){
    if (this._element === null){
        this.createDom();
    }
    return this._element;
};
WrappedElement.prototype.inDocument = function(){
    return this._in_document;
};
WrappedElement.prototype.enterDocument = function(){
    return this._in_document = true;
};
WrappedElement.prototype.hasElement = function(){
    return (this._element !== null);
};
WrappedElement.prototype.makeElement = function(html_tag){
    //makes jQuery element with tags
    return $('<' + html_tag + '></' + html_tag + '>');
};
WrappedElement.prototype.dispose = function(){
    this._element.remove();
    this._in_document = false;
};

var SimpleControl = function(){
    WrappedElement.call(this);
    this._handler = null;
    this._title = null;
};
inherits(SimpleControl, WrappedElement);

SimpleControl.prototype.setHandler = function(handler){
    this._handler = handler;
    if (this.hasElement()){
        this.setHandlerInternal();
    }
};

SimpleControl.prototype.setHandlerInternal = function(){
    //default internal setHandler behavior
    setupButtonEventHandlers(this._element, this._handler);
};

SimpleControl.prototype.setTitle = function(title){
    this._title = title;
};

var EditLink = function(){
    SimpleControl.call(this)
};
inherits(EditLink, SimpleControl);

EditLink.prototype.createDom = function(){
    var element = $('<a></a>');
    element.addClass('edit');
    this.decorate(element);
};

EditLink.prototype.decorate = function(element){
    this._element = element;
    this._element.attr('title', $.i18n._('click to edit this comment'));
    this._element.html($.i18n._('edit'));
    this.setHandlerInternal();
};

var DeleteIcon = function(title){
    SimpleControl.call(this);
    this._title = title;
};
inherits(DeleteIcon, SimpleControl);

DeleteIcon.prototype.decorate = function(element){
    this._element = element;
    this._element.attr('class', 'delete-icon');
    this._element.attr('title', this._title);
    if (this._handler !== null){
        this.setHandlerInternal();
    }
};

DeleteIcon.prototype.setHandlerInternal = function(){
    setupButtonEventHandlers(this._element, this._handler);
};

DeleteIcon.prototype.createDom = function(){
    this._element = this.makeElement('span');
    this.decorate(this._element);
};

var Tag = function(){
    SimpleControl.call(this);
    this._deletable = false;
    this._delete_handler = null;
    this._delete_icon_title = null;
    this._tag_title = null;
    this._name = null;
    this._url_params = null;
    this._inner_html_tag = 'a';
    this._html_tag = 'li';
}
inherits(Tag, SimpleControl);

Tag.prototype.setName = function(name){
    this._name = name;
};

Tag.prototype.getName = function(){
    return this._name;
};

Tag.prototype.setHtmlTag = function(html_tag){
    this._html_tag = html_tag;
};

Tag.prototype.setDeletable = function(is_deletable){
    this._deletable = is_deletable;
};

Tag.prototype.setLinkable = function(is_linkable){
    if (is_linkable === true){
        this._inner_html_tag = 'a';
    } else {
        this._inner_html_tag = 'span';
    }
};

Tag.prototype.isLinkable = function(){
    return (this._inner_html_tag === 'a');
};

Tag.prototype.isDeletable = function(){
    return this._deletable;
};

Tag.prototype.isWildcard = function(){
    return (this.getName().substr(-1) === '*');
};

Tag.prototype.setUrlParams = function(url_params){
    this._url_params = url_params;
};

Tag.prototype.setHandlerInternal = function(){
    setupButtonEventHandlers(this._element.find('.tag'), this._handler);
};

/* delete handler will be specific to the task */
Tag.prototype.setDeleteHandler = function(delete_handler){
    this._delete_handler = delete_handler;
    if (this.hasElement() && this.isDeletable()){
        this._delete_icon.setHandler(delete_handler);
    }
};

Tag.prototype.getDeleteHandler = function(){
    return this._delete_handler;
};

Tag.prototype.setDeleteIconTitle = function(title){
    this._delete_icon_title = title;
};

Tag.prototype.decorate = function(element){
    this._element = element;
    var del = element.find('.delete-icon');
    if (del.length === 1){
        this.setDeletable(true);
        this._delete_icon = new DeleteIcon();
        if (this._delete_icon_title != null){
            this._delete_icon.setTitle(this._delete_icon_title);
        }
        //do not set the delete handler here
        this._delete_icon.decorate(del);
    }
    this._inner_element = this._element.find('.tag');
    this._name = this.decodeTagName($.trim(this._inner_element.html()));
    if (this._title !== null){
        this._inner_element.attr('title', this._title);
    }
    if (this._handler !== null){
        this.setHandlerInternal();
    }
};

Tag.prototype.getDisplayTagName = function(){
    //replaces the trailing * symbol with the unicode asterisk
    return this._name.replace(/\*$/, '&#10045;');
};

Tag.prototype.decodeTagName = function(encoded_name){
    return encoded_name.replace('\u273d', '*');
};

Tag.prototype.createDom = function(){
    this._element = this.makeElement(this._html_tag);
    //render the outer element
    if (this._deletable){
        this._element.addClass('deletable-tag');
    }
    this._element.addClass('tag-left');

    //render the inner element
    this._inner_element = this.makeElement(this._inner_html_tag);
    if (this.isLinkable()){
        var url = askbot['urls']['questions'];
        url += '?tags=' + escape(this.getName());
        if (this._url_params !== null){
            url += escape('&' + this._url_params);
        }
        this._inner_element.attr('href', url);
    }
    this._inner_element.addClass('tag tag-right');
    this._inner_element.attr('rel', 'tag');
    if (this._title === null){
        this.setTitle(
            $.i18n._(
                "see questions tagged '{tag}'"
            ).replace(
                '{tag}',
                this.getName()
            )
        );
    }
    this._inner_element.attr('title', this._title);
    this._inner_element.html(this.getDisplayTagName());

    this._element.append(this._inner_element);

    if (!this.isLinkable() && this._handler !== null){
        this.setHandlerInternal();
    }

    if (this._deletable){
        this._delete_icon = new DeleteIcon();
        this._delete_icon.setHandler(this.getDeleteHandler());
        if (this._delete_icon_title !== null){
            this._delete_icon.setTitle(this._delete_icon_title);
        }
        this._element.append(this._delete_icon.getElement());
    }
};

//Search Engine Keyword Highlight with Javascript
//http://scott.yang.id.au/code/se-hilite/
Hilite={elementid:"content",exact:true,max_nodes:1000,onload:true,style_name:"hilite",style_name_suffix:true,debug_referrer:""};Hilite.search_engines=[["local","q"],["cnprog\\.","q"],["google\\.","q"],["search\\.yahoo\\.","p"],["search\\.msn\\.","q"],["search\\.live\\.","query"],["search\\.aol\\.","userQuery"],["ask\\.com","q"],["altavista\\.","q"],["feedster\\.","q"],["search\\.lycos\\.","q"],["alltheweb\\.","q"],["technorati\\.com/search/([^\\?/]+)",1],["dogpile\\.com/info\\.dogpl/search/web/([^\\?/]+)",1,true]];Hilite.decodeReferrer=function(d){var g=null;var e=new RegExp("");for(var c=0;c<Hilite.search_engines.length;c++){var f=Hilite.search_engines[c];e.compile("^http://(www\\.)?"+f[0],"i");var b=d.match(e);if(b){var a;if(isNaN(f[1])){a=Hilite.decodeReferrerQS(d,f[1])}else{a=b[f[1]+1]}if(a){a=decodeURIComponent(a);if(f.length>2&&f[2]){a=decodeURIComponent(a)}a=a.replace(/\'|"/g,"");a=a.split(/[\s,\+\.]+/);return a}break}}return null};Hilite.decodeReferrerQS=function(f,d){var b=f.indexOf("?");var c;if(b>=0){var a=new String(f.substring(b+1));b=0;c=0;while((b>=0)&&((c=a.indexOf("=",b))>=0)){var e,g;e=a.substring(b,c);b=a.indexOf("&",c)+1;if(e==d){if(b<=0){return a.substring(c+1)}else{return a.substring(c+1,b-1)}}else{if(b<=0){return null}}}}return null};Hilite.hiliteElement=function(f,e){if(!e||f.childNodes.length==0){return}var c=new Array();for(var b=0;b<e.length;b++){e[b]=e[b].toLowerCase();if(Hilite.exact){c.push("\\b"+e[b]+"\\b")}else{c.push(e[b])}}c=new RegExp(c.join("|"),"i");var a={};for(var b=0;b<e.length;b++){if(Hilite.style_name_suffix){a[e[b]]=Hilite.style_name+(b+1)}else{a[e[b]]=Hilite.style_name}}var d=function(m){var j=c.exec(m.data);if(j){var n=j[0];var i="";var h=m.splitText(j.index);var g=h.splitText(n.length);var l=m.ownerDocument.createElement("SPAN");m.parentNode.replaceChild(l,h);l.className=a[n.toLowerCase()];l.appendChild(h);return l}else{return m}};Hilite.walkElements(f.childNodes[0],1,d)};Hilite.hilite=function(){var a=Hilite.debug_referrer?Hilite.debug_referrer:document.referrer;var b=null;a=Hilite.decodeReferrer(a);if(a&&((Hilite.elementid&&(b=document.getElementById(Hilite.elementid)))||(b=document.body))){Hilite.hiliteElement(b,a)}};Hilite.walkElements=function(d,f,e){var a=/^(script|style|textarea)/i;var c=0;while(d&&f>0){c++;if(c>=Hilite.max_nodes){var b=function(){Hilite.walkElements(d,f,e)};setTimeout(b,50);return}if(d.nodeType==1){if(!a.test(d.tagName)&&d.childNodes.length>0){d=d.childNodes[0];f++;continue}}else{if(d.nodeType==3){d=e(d)}}if(d.nextSibling){d=d.nextSibling}else{while(f>0){d=d.parentNode;f--;if(d.nextSibling){d=d.nextSibling;break}}}}};if(Hilite.onload){if(window.attachEvent){window.attachEvent("onload",Hilite.hilite)}else{if(window.addEventListener){window.addEventListener("load",Hilite.hilite,false)}else{var __onload=window.onload;window.onload=function(){Hilite.hilite();__onload()}}}};
/* json2.js by D. Crockford */
if(!this.JSON){this.JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==="string"){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());
