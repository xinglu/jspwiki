
package com.ecyrd.jspwiki.action;

import junit.framework.Test;
import junit.framework.TestCase;
import junit.framework.TestSuite;

public class AllTests extends TestCase
{
    public AllTests( String s )
    {
        super( s );
    }

    public static Test suite()
    {
        TestSuite suite = new TestSuite("ActionBean tests");

        suite.addTest( GroupActionBeanTest.suite() );
        suite.addTest( LoginActionBeanTest.suite() );
        suite.addTest( RenameActionBeanTest.suite() );
        suite.addTest( UserPreferencesActionBeanTest.suite() );
        suite.addTest( UserProfileActionBeanTest.suite() );
        suite.addTest( ViewActionBeanTest.suite() );
        suite.addTest( WikiContextFactoryTest.suite() );

        return suite;
    }
}