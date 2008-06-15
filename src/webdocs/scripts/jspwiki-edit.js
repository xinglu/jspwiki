/* 
    JSPWiki - a JSP-based WikiWiki clone.

    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.  
 */
 
/**
 ** Javascript routines to support JSPWiki Editing
 ** since v.2.6.0
 ** uses mootools v1.1
 **
 ** Needs jspwiki-common.js and mootools.js
 ** EditTools object (main object)
 ** - find&replace functionality : with regexp support
 ** - included popup-pagelinks routines from Janne 
 **
 ** TextArea object
 **     Supports selections inside textarea, in ie and other browsers
 **/
var WikiSnippets =
{
	getSnippets: function(){  
		return {
	"toc" : {
		snippet:["","[{TableOfContents }]", "\n"],
		tab:['[{TableOfContents }]', '']
	},
	"link" : {
		snippet:["[","link text|pagename", "]"],
		tab:['link text','pagename','']
	},
	"code" : {
		snippet:["%%prettify \n{{{\n","some code block", "\n}}}\n/%\n"],
		tab:['some code block','']
	},
	"pre" : {
		snippet:["{{{\n","some preformatted block", "\n}}}\n"],
		tab:['some preformatted block','']
	},
	"br" : {
		snippet:['\\\\\n','',''],
		tab:['']
	},
	"bold" : {
		snippet:["__","some bold text", "__"],
		tab:['some bold text','']
	},
	"italic" : {
		snippet:["''","some italic text", "''"],
		tab:['some italic text','']
	},
	"h1" : {
		snippet:["!!!","Heading 1 title\n", ""],
		tab:["Heading 1 title\n", ""]
	},
	"h2" : {
		snippet:["!!","Heading 2 title", ""],
		tab:["Heading 2 title\n", ""]
	},
	"h3" : {
		snippet:["!","Heading 3 title", ""],
		tab:["Heading 3 title\n", ""]
	},
	"dl" : {
		snippet:[";","term:definition text", ""],
		tab:["term","definition text", ""]
	},
	"mono" : {
		snippet:["{{","some monospaced text", "}}"],
		tab:["some monospaced text", ""]
	},
	"hr" : {
		snippet:['','----','\n'],
		tab:['']
	},
	"sub" : {
		snippet:["%%sub ","subscript text", "/%"],
		tab:['subscript text','']
	},
	"sup" : {
		snippet:["%%sup ","superscript text", "/%"],
		tab:['superscript text','']
	},
	"strike" : {
		snippet:["%%strike ","strikethrough text", "/%"],
		tab:['strikethrough text','']
	},
	"tab" : {
		snippet:["%%tabbedSection \n","%%tab-tabTitle1\ntab content 1\n/%\n%%tab-tabTitle2\ntab content 2", "\n/%\n/%\n"],
		tab:['tabTitle1','tab content 1','tabTitle2','tab content 2','']
	},
	"table" : {
		snippet:["\n","||heading 1||heading 2\n| cell 1   | cell 2", "\n"],
		tab:['heading 1','heading 2','cell 1','cell 2','']
	},
	"img" : {
		snippet:["","[{Image src='img.jpg' width='..' height='..' align='left|center|right' style='..' class='..' }]", "\n"],
		tab:['img.jpg', '']
	},
	"quote" : {
		snippet:["%%quote \n","quoted text", "\n/%\n"],
		tab:['quoted text','']
	},
	"%%" : {
		snippet:["%%","wikistyle\nsome text", "\n/%"],
		tab:['wikistyle','some text','']
	},
	//dynamic snippets
	"sign" : {
		snippet:["\\\\\n--",Wiki.UserName+", "+"25 Sep 07","\n"],
		tab:[Wiki.UserName,'25 Sep 07','']
	},
	/* TODO: how to insert the proper current date/timestamp, inline with the preferred time format */
	"date" : {
		//return new object snippet
		command: function(k) {
			var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
			monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"],
			dt = new Date(),
			y  = dt.getYear();
			if (y < 1000) y +=1900;
			var date = dayNames[dt.getDay()] + ", " + monthNames[dt.getMonth()] + " " + dt.getDate() + ", " + y;
			return {
				//key:"date", optional
				snippet:['',date,' '],
				tab:[date,'']
			};
		}
	}
		} /* return */

	},
	getSmartPairs: function(){
		return {
		'"' : '"',
		'(' : ')',
		'{' : '}',
		'[' : ']',
		'<' : '>',
		"'" : { scope:{ "{{{":"}}}" }, pair:"'" }
		}
	}
}

/*
 *
 *
 */
var EditTools = 
{
	onPageLoad: function(){

		Wiki.onPageLoad(); //Wiki.onpageload should always run first, but seems not guaranteed on ie sos let's do this for sure
		
		this.textarea = $('editorarea'); 
		if(!this.textarea || !this.textarea.visible) return;

		/* Duplicate the textarea into a main and work area.
		   The workarea is used for actual editing.
		   The mainarea reflects at all times the whole document
		*/
		var m = this.mainarea = this.textarea;
		this.textarea = m.clone()
			.removeProperty('id')
			.removeProperty('name')
			.injectBefore( m.hide() ); 

		//this.ta = new TextArea( this.textarea );
		this.ta = TextArea.initialize( this.textarea );

		window.onbeforeunload = (function(){
			var ta = $('editorarea');
			if(ta.value != ta.defaultValue) return "edit.areyousure".localize();
		}).bind(this);

		//alert($('scroll').getValue());

		this.wikisnippets = WikiSnippets.getSnippets();
		this.wikismartpairs = WikiSnippets.getSmartPairs();

		this.onPageLoadSectionToc();
		this.onPageLoadResizeTextarea();
		this.onPageLoadToolbar();

		this.onPageLoadPostEditor();
		this.onPageLoadPreview();

		/* add textarea suggestion events */
		this.textarea
			.addEvent('click',this.getSuggestions.bind(this))
			.addEvent('keyup',this.getSuggestions.bind(this))
			.focus();
		
//		Wiki.setFocus();
	},

	/* add textarea resize drag bar */
	onPageLoadResizeTextarea: function(){	
		var hh=Wiki.prefs.get('EditorSize');
		if(hh) this.textarea.setStyle('height',hh);

		var h = new Element('div',{
			'class':'textarea-resizer', 
			'title':'edit.resize'.localize()
		}).injectAfter(this.textarea);	

		this.textarea.makeResizable({
			handle:h, 
			modifiers: {x:false, y:'height'}, 
			onComplete: function(){	Wiki.prefs.set('EditorSize',this.value.now.y); }
		});		
		
	},	

	onPageLoadToolbar: function(){	
		$('tools').addClass('collapsebox-closed');
		Collapsible.render('editform','');

		$('tbREDO').addEvent('click', this.redo.bind(this) );
		$('tbUNDO').addEvent('click', this.undo.bind(this) );
		$('doreplace').addEvent('click', this.doReplace.bind(this) );
		$$('#tools a.tool').addEvent('click',this.toggleSnippet.bind(this) );

	},

	doReplace: function(e){
		new Event(e).stop();

		var findText	= $('tbFIND').value,
			replaceText	= $('tbREPLACE').value,
			isRegExp	= $('tbREGEXP').checked,
			reGlobal	= $('tbGLOBAL').checked ? 'g' : '',
			reMatchCase	= $('tbMatchCASE').checked ? '' : 'i';

		if( findText == "") return;

		var sel = TextArea.getSelection(this.textarea),
			data = ( !sel || (sel=="") ) ? this.textarea.value : sel;

		if(!isRegExp){ /* escape all special re characters */
			var re = new RegExp( "([\.\*\\\?\+\[\^\$])", "gi");
			findText = findText.replace( re,"\\$1" );
		}
		
		var re = new RegExp(findText, reGlobal+reMatchCase+"m" ); //multiline
		if(!re.exec(data)){
			Wiki.alert( "edit.findandreplace.nomatch".localize() );
			return true;
		}
		
		data = data.replace(re, replaceText);  
	
		this.store();
		if(!sel || (sel=="")){
			this.textarea.value = data;
		} else {
			TextArea.replaceSelection( this.textarea, data );
		}
		this.textarea.fireEvent('change');		
	} ,
	
/*  not stable across browsers	
	doFind: function(){
		var ta = this.ta,
			data = this.textarea.value,
			find = $('tbFIND').value, 
			findlen = find.length,
			isRegExp = $('tbREGEXP').checked,
			reGlobal = $('tbGLOBAL').checked ? 'g' : '',
			reMatchCase	= $('tbMatchCASE').checked ? '' : 'i';

		if(find == "") return;
		
		//this.textarea.addEvent("select", function(){ alert('beep') });

		var sel = TextArea.getSelectionCoordinates(this.textarea),
			selection = data.substring(sel.start,sel.end);

		data = data.substr(sel.start);

		if(!isRegExp){ find = find.escapeRegExp(); }
		var re = new RegExp("("+find+")", reGlobal+reMatchCase+"m" ); //multiline

		var match = data.match(re);
		if( match && match[0] == selection){ data = data.substr(match.length); sel.start+=match.length}

		var newstart = data.search(re);
		match = RegExp.$1;

		if(newstart == -1){
			Wiki.alert( "edit.findandreplace.nomatch".localize() );
		} else {
			sel.start+=newstart;
			
			ta.setSelection(sel.start, sel.start + match.length );
			
			var el = this.textarea;
			var i = sel.start + match.length;

			try {  //only ok on firefox
			el.setSelectionRange(i-1,i);
			var evx = document.createEvent("KeyEvents");
			evx.initKeyEvent('keypress', true, true, window,
				false, false, false, false, 0,
				el.value.charCodeAt(i-1));
			el.dispatchEvent(evx);		// causes the scrolling
			
			} catch(e) { }

			ta.setSelection(sel.start, i);			
		}		
		
	},
*/			
	onPageLoadPostEditor: function(){
		if(window.ie) return;
		
		$('toolextra').show();
		this.posteditor = new postEditor.create(this.textarea,'changenote');
		
		/* patch posteditor DF Jul 07 */
		/* righ-arrow nok on FF, nop on Safari */
		this.posteditor.onKeyRight = Class.empty; 				
		/* make posteditor changes undoable */
		this.posteditor.value = function(value) {
			EditTools.store();
			this.element.value = value.join("");
			this.element.fireEvent('change');		
		};

		/* next extra fix for latest Safari 3.1 cause tabs are not catched anymore in the onkeypress handler */
		/* TODO: this could be a great workaround for ie as well */
		if( window.webkit ){ 
			this.textarea.addEvent('keydown',function(e){
				if(e.keyCode == 9) EditTools.posteditor.onKeyPress(e);
			});
		};

		['smartpairs', 'tabcompletion'].each( function(el){
			$(el).setProperty('checked', Wiki.prefs.get(el) || false)
				 .addEvent('click',function(e) {
				 	//new Event(e).stop();
					Wiki.prefs.set(el,this.checked);
					EditTools.initPostEditor();
				 });
		},this);
				
		this.initPostEditor();	
	},

	initPostEditor: function(){
		if(! this.posteditor) return;
		this.posteditor.changeSmartTypingPairs( $('smartpairs').checked ? this.wikismartpairs : {} );
		this.posteditor.changeSnippets( $('tabcompletion').checked ? this.wikisnippets : {} );	
	},

	toggleSnippet: function(e) {
		e = new Event(e).stop();

		var el  = e.target,
			snippy = this.wikisnippets[el.getText()]; 

		if(!snippy) return;

		var s = TextArea.getSelection(this.textarea),
			sn1 = snippy.snippet[0],
			sn2 = snippy.snippet[2],
			t = snippy.snippet.join('');

		this.store();

		if((el.rel=='break') && (!TextArea.isSelectionAtStartOfLine(this.textarea))) { 
			t = "\n" + t;
		}
		if(s) {
			// toggle markup
			if((s.indexOf(sn1) == 0) && (s.lastIndexOf(sn2) == (s.length - sn2.length))) {
				t = s.substring(sn1.length, s.length-sn2.length);
			} else {
				t = t.replace( snippy.tab[0], s)
			}
		}
		TextArea.replaceSelection(this.textarea, t);
	} ,

	/* TOOLBAR: cut/copy/paste clipboard functionality */
	/*
	_CLIP : null,
	clipboard : function( format ){
		var s = TextArea.getSelection(this.textarea);
		if( !s || s == "") return;

		this._CLIP = s ;
		$( 'tbPASTE' ).className = this.ToolbarMarker;
		var ss = format.replace( /\$/, s);
		if( s == ss ) return; //copy

		this.store(); //cut
		TextArea.replaceSelection( this.textarea, ss );
	} ,
	paste : function(){
		if( !this._CLIP ) return;
		this.store();
		TextArea.replaceSelection( this.textarea, this._CLIP );
	} ,
	*/
	// *** UNDO functionality ***
	$undo : [],
	$redo : [],
	$maxundo : 20,
	
	$get: function() {
		var ta = this.textarea,
			sel = TextArea.getSelectionCoordinates(ta);
		return { 
			main:this.mainarea.value,
			value:ta.value, 
			cursor:sel, 
			scrollTop:ta.scrollTop, 
			scrollLeft:ta.scrollLeft
		};
	},
	$put: function(o){
		var ta = this.textarea;
		this.mainarea.value = o.main;
		ta.value = o.value;
		ta.scrollTop = o.scrollTop;
		ta.scrollLeft = o.scrollLeft;
		TextArea.setSelection(o.cursor.start,o.cursor.end);
		ta.fireEvent('change');
	},
	store: function() {
		this.$undo.push( this.$get() );
		this.$redo = [];
		if(this.$undo.length > this.$maxundo) this.$undo.shift();

		$('tbUNDO').disabled = '';
		$('tbREDO').disabled = 'true';
	},
	undo: function(e){
		new Event(e).stop();
		if(this.$undo.length > 0){
			$('tbREDO').disabled = '';
			this.$redo.push( this.$get() );
			this.$put( this.$undo.pop() );
		} else {
			$('tbUNDO').disabled = 'true';
		}
	},	
	redo: function(e){
		new Event(e).stop();
		if(this.$redo.length > 0){
			this.$undo.push( this.$get() );
			this.$put( this.$redo.pop() );
			$('tbUNDO').disabled = '';
		} else {
			$('tbREDO').disabled = 'true';
		}
	},

	// *** end of UNDO functionality ***
	
	getSuggestions: function() {
		var textarea = this.textarea,
			//pos = TextArea.getCursor(textarea),
			sel = TextArea.getSelectionCoordinates(textarea),
			val = textarea.value,
			searchword = "";
			
		var	suggestID = 'findSuggestionMenu', fav = $('favorites'),
			suggest = $(suggestID) || new Element('div',{
				'id':suggestID 
			}).injectTop(fav);

		/* find a partial jspwiki-link 'searchword' */
		/* look backwards for the start of a wiki-link bracket */
		for( i = sel.start-1; i >= 0; i-- ){
			if( val.charAt(i) == ']' ) break;
			if( val.charAt(i) == '[' && i < val.length-1 ) { 
				searchword = val.substring(i+1,sel.start); 
				if(searchword.indexOf('|') != -1) searchword = searchword.split('|')[1];
				break; 
			}
		}
		if(searchword =="") return suggest.hide();

		var searchlen = searchword.length;		

		if(sel.start == sel.end) { //when no selection, extend till next ]
			var i = val.indexOf(']',sel.start);
			if( i>0 ) sel.end = i
		}

		Wiki.jsonrpc('search.getSuggestions', [searchword,30], function(result,exception){
			if(exception) { 
				alert(exception.message); 
			} else if(!result.list || (result.list.length == 0)) { 
				suggest.hide();
			} else {
				var ul = new Element('ul').inject( suggest.empty().show() );
				result.list.each( function(rslt) { 
					new Element('li',{
						'title':rslt,
						'events': {
							'click':function(ev){ 
								new Event(ev).stop(); 
								EditTools.store();
								TextArea.setSelection(sel.start,sel.end);
								TextArea.replaceSelection(textarea, rslt.substr(searchlen));
								sel.end = sel.start + rslt.length - searchlen;
							},
							'mouseout': function(){ this.removeClass('hover') },
							'mouseover':function(){ this.addClass('hover') }
						}
					}).setHTML(rslt.trunc(36) ).inject(ul);
				}); /* each */
			} /* endif */
		});
	},
	
	onPageLoadPreview : function(){
		if( $$('#sneakpreview','#autopreview').length != 2) return;
		$('autopreview')
			.setProperty('checked', Wiki.prefs.get('autopreview') || false)
			.addEvent('click', function(){ 
				var ta = this.textarea,
					isOn = $('autopreview').checked;

				$('sneakpreview').empty();
				ta.removeEvents('preview');
				Wiki.prefs.set('autopreview',isOn);

				if(isOn) ta.addEvent('preview', this.refreshPreview.bind(this)).fireEvent('preview');

			}.bind(this)).fireEvent('click');
    },
	refreshPreview: function(){
    	var	preview = $('sneakpreview');
		this.bgcolor = this.bgcolor || preview.getStyle('background-color');

    	var	bgcolorfx = (this.bgcolor == 'transparent' ) ? '#fff' : this.bgcolor,
    		previewfx = preview.effect('background-color', {
    			duration:2000,
    			wait:false,
    			onComplete:function(){ preview.setStyle('background-color', this.bgcolor); }
    		});

		//TODO: put a spinner in the preview result block
		new Ajax( Wiki.TemplateUrl + "/AJAXPreview.jsp?page="+Wiki.PageName, { 
			postBody: 'wikimarkup=' + encodeURIComponent(this.textarea.value),
			update: preview,
			onComplete: function(){ 
				Wiki.renderPage(preview, Wiki.PageName);
				previewfx.start('#ffff88',bgcolorfx); 
			}
		}).request();
	},

	onPageLoadSectionToc : function(){
		/* initialise a new sectionToc menu */
		this.selector = new Element('ul');
		Wiki.makeMenuFx( 'tbOUTLINE', this.selector);

		this.onSelectorLoad();
    
		var cursor = location.search.match(/[&?]section=(\d+)/);
		cursor = (cursor && cursor[1]) ? 1+cursor[1].toInt() : 0;
		if((cursor>0) && this.textarea.sop) cursor++;

		this.onChangeSelector(cursor);

		this.textarea.addEvent('change', this.onChangeTextarea.bind(this));		
	},	
	
	/* 
	 * UPDATE/RFEFRESH the section selector dropdown
	 * This function is called at startup, and everytime the section textarea changes
	 * Postcondition: the sectiontoc dropdown contains following entries
	 *   0. ( all )
	 *   1. start-of-page (if applicable)
	 *   2. text==<<header 1...n>> , <<selector.offset stores start-offset in main textarea>>
	 */  
	 onSelectorLoad : function(){
		var mainarea = this.mainarea.value,
			ta = this.textarea,
			DELIM = "\u00a4";
		 
		/* mask all headers inside a {{{ ... }}} but keep length unchanged! */
		mainarea = mainarea.replace(/\{\{\{([\s\S]*?)\}\}\}/g, function(match){
			return match.replace( /^!/mg, ' ' );
		});

		var tt = mainarea.replace( /^([!]{1,3})/mg, DELIM+"$1"+DELIM ).split(DELIM);
		
		this.newSelector();
		ta.sop = (tt.length>1) && (tt[0] != ''); //start of page section has no !!!header 
		if(ta.sop) this.addSelector("edit.startOfPage".localize(), 0, 0);
		
		var pos = tt.shift().length,
			ttlen = tt.map(function(i){ return i.length });

		for(var i=0; i<ttlen.length; i=i+2){
			var hlen = ttlen[i],  //length of header markup !!!,!! or !
				indent = (hlen==2) ? 1 : (hlen==1) ? 2 : 0,
				title = tt[i+1].match(/.*?$/m)[0]; //title is first line only

			this.addSelector(title, pos, indent);
			pos += hlen + ttlen[i+1];
		};
	},

	setSelector: function( cursor ){
		var els = this.selector.getChildren();
		
		if(cursor <0 || cursor >= els.length) cursor = 0;
		els.removeClass('cursor');
		els[cursor].addClass('cursor');
	},

	newSelector: function(){
		this.selector.empty();
		this.selector.offsets = [];
		this.addSelector("edit.allsections".localize(),-1,0);
	},

	addSelector: function(text,offset,indent){
		text = text.replace(/~([^~])/g, '$1'); /*remove wiki-markup escape chars ~ */
		this.selector.offsets.push(offset);
		this.selector.adopt( 
			new Element('li').adopt(
				new Element('a',{
					'class':'action',
					'styles': {
						'padding-left':(indent+0.5)+'em'
					},
					'title':text,
					'events':{
						'click':this.onChangeSelector.pass([this.selector.offsets.length-1],this) 
					}
				}).setHTML(text.trunc(48))
			) 
		);	
	},

	/* the USER clicks a new item from the section selector dropdown
	 * copy a part of the main textarea to the section textarea
	 */
	onChangeSelector: function(cursor){
		var se = this.selector.offsets, 
			ta = this.textarea, 
			ma = this.mainarea.value;

		this.setSelector(cursor);
		ta.cursor = cursor;
		ta.begin = (cursor==0) ? 0 : se[cursor];
		ta.end = ((cursor==0) || (cursor+1 >= se.length)) ? ma.length : se[cursor+1]; 
		ta.value = ma.substring(ta.begin,ta.end);		
		
		ta.fireEvent('preview');
	},

	/*
	 * Changes in the section textarea: 
	 * happens when 
	 *  (i)  textarea is changed and deselected (click outside the textarea) 
	 *  (ii) user clicks a toolbar-button
	 *  
	 * 1) copy section textarea at the right offset of the main textarea
	 * 2) refresh the sectiontoc menu
	 */
	onChangeTextarea : function(){
		var	ta = this.textarea,	ma = this.mainarea;

		var	s = ta.value;
		if( s.lastIndexOf("\n") + 1 != s.length ) ta.value += '\n';
		 
		s = ma.value;
		ma.value = s.substring(0, ta.begin) + ta.value + s.substring(ta.end);
		ta.end = ta.begin + ta.value.length;
		this.onSelectorLoad();  //refresh selectortoc menu
		ta.fireEvent('preview');
	 }
} 

/* 
 * TextArea support routines 
 *
 * with buildin undo/redo functionality
 */
//var TextArea = new Class({
var TextArea =
{
	initialize: function(el){
		this.textarea = $(el);
		return this;
	},

	getSelection: function(id){
		var f = $(id); if(!f) return ''; 
		
		// IE fixme: this returns any selection, not only selected text in the textarea 
		//if(window.ie) return document.selection.createRange().text;
		//return f.getValue().substring(f.selectionStart, f.selectionEnd);
		
		var cur = this.getSelectionCoordinates(id);
		return f.getValue().substring(cur.start, cur.end);		
	},

	setSelection: function(start, end){
		var ta = this.textarea;
		if(window.ie){
			var r1 = ta.createTextRange();
			r1.collapse(true);
			r1.moveStart('character',start);
			r1.moveEnd('character',end-start);
			r1.select();
		} else {
			ta.selectionStart = start;
			ta.selectionEnd = end;
		}
	},

	// getCursor(id) : returns start offset of cursor (integer)
	getCursor: function(id) {
		return this.getSelectionCoordinates(id).start;
	},
	
	// getSelectionCoordinates : returns {'start':x, 'end':y } coordinates of the selection
	getSelectionCoordinates: function(id) {
		var f = $(id); if(!f) return ''; 

		if(window.ie){
			var r1 = document.selection.createRange(),
				r2 = r1.duplicate(); // use as a 'dummy' 
				
			r2.moveToElementText( f ); // select all text 
			r2.setEndPoint( 'EndToEnd', r1 );  // move 'dummy' end point to end point of original range 

			return { 
				'start': r2.text.length - r1.text.length, 
				'end': r2.text.length
			};
			
		}
		else if( f.selectionStart || f.selectionStart == '0') {
			return {'start':f.selectionStart,'end':f.selectionEnd };
		} else {
			return {'start':f.value.length,'end':f.value.length };
		}
	},

	// replaceSelection(id,newtext) replaces the selection with a newtext, an selects the replaced newtext
	replaceSelection: function(id, newText){
		var f = $(id); if(!f) return;
		var scrollTop = f.scrollTop; //cache top
		 
		if(window.ie){
			f.focus();
			var range = document.selection.createRange();
			range.text = newText;			
			range.collapse(true);
			range.moveStart("character", -newText.length);
			range.select();
		} else { 
			var start = f.selectionStart, 
				end = f.selectionEnd;
			f.value = f.value.substring(0, start) + newText + f.value.substring(end);
			f.selectionStart = start;
			f.selectionEnd = start + newText.length;
		}
		f.focus();
		f.scrollTop = scrollTop;
		
		f.fireEvent('change');
	},
	
	// isSelectionAtStartOfLine(id): returns boolean indicating whether cursor is at the start of newline
	isSelectionAtStartOfLine: function(id){
		var f = $(id); if(!f) return false;

		var i = this.getCursor(id);
	    return( (i<=0) || ( f.value.charAt( i-1 ).match( /[\n\r]/ ) ) );
	}
	
};

window.addEvent('load', EditTools.onPageLoad.bind(EditTools) ); //edit only