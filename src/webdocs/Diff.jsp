<%@ page import="org.apache.log4j.*" %>
<%@ page import="com.ecyrd.jspwiki.*" %>
<%@ page import="com.ecyrd.jspwiki.tags.WikiTagBase" %>
<%@ page import="com.ecyrd.jspwiki.tags.InsertDiffTag" %>
<%@ page errorPage="/Error.jsp" %>
<%@ taglib uri="/WEB-INF/jspwiki.tld" prefix="wiki" %>

<%! 
    public void jspInit()
    {
        wiki = WikiEngine.getInstance( getServletConfig() );
    }

    Category log = Category.getInstance("JSPWiki"); 
    WikiEngine wiki;
%>


<%
    WikiContext wikiContext = wiki.createContext( request, 
                                                  WikiContext.DIFF );
    String pagereq = wikiContext.getPage().getName();

    NDC.push( wiki.getApplicationName()+":"+pagereq );

    String pageurl = wiki.encodeName( pagereq );

    // If "r1" is null, then assume current version (= -1)
    // If "r2" is null, then assume the previous version (=current version-1)

    // FIXME: There is a set of unnecessary conversions here: InsertDiffTag
    //        does the String->int conversion anyway.

    WikiPage wikipage = wikiContext.getPage();

    String srev1 = request.getParameter("r1");
    String srev2 = request.getParameter("r2");

    int ver1 = -1, ver2 = -1;

    if( srev1 != null )
    {
        ver1 = Integer.parseInt( srev1 );
    }

    if( srev2 != null )
    {
        ver2 = Integer.parseInt( srev2 );
    }
    else
    {
        int lastver = wikipage.getVersion();

        if( lastver > 1 )
        {
            ver2 = lastver-1;
        }
    }

    pageContext.setAttribute( WikiTagBase.ATTR_CONTEXT,
                              wikiContext,
                              PageContext.REQUEST_SCOPE );

    pageContext.setAttribute( InsertDiffTag.ATTR_OLDVERSION,
                              new Integer(ver1),
                              pageContext.REQUEST_SCOPE );
    pageContext.setAttribute( InsertDiffTag.ATTR_NEWVERSION,
                              new Integer(ver2),
                              pageContext.REQUEST_SCOPE );

    // log.debug("Request for page diff for '"+pagereq+"' from "+request.getRemoteAddr()+" by "+request.getRemoteUser()+".  R1="+ver1+", R2="+ver2 );

    response.setContentType("text/html; charset="+wiki.getContentEncoding() );

    String contentPage = wiki.getTemplateManager().findJSP( pageContext,
                                                            wikiContext.getTemplate(),
                                                            "ViewTemplate.jsp" );
%>

<wiki:Include page="<%=contentPage%>" />

<%
    NDC.pop();
    NDC.remove();
%>
