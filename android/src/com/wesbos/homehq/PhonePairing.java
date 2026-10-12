package com.wesbos.homehq;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/** A QR invitation creates a pending browser, never photo access by itself. */
final class PhonePairing {
  private final SecureRandom random = new SecureRandom();
  private String invitation="",pending="",request="",number="",session="";
  private long invitationExpires,pendingExpires,expires;
  private int failures;
  synchronized void start(long now){clear();expires=now+15*60000L;invitationExpires=now+5*60000L;invitation=token();}
  synchronized void clear(){invitation=pending=request=number=session="";invitationExpires=pendingExpires=expires=0;failures=0;}
  private String token(){byte[] bytes=new byte[32];random.nextBytes(bytes);StringBuilder out=new StringBuilder();for(byte b:bytes)out.append(String.format(Locale.ROOT,"%02x",b&255));return out.toString();}
  private static boolean equal(String a,String b){return MessageDigest.isEqual(a.getBytes(StandardCharsets.US_ASCII),b.getBytes(StandardCharsets.US_ASCII));}
  private void expire(long now){if(now>=expires){invitation=pending=request=number=session="";return;}if(!pending.isEmpty()&&now>=pendingExpires){pending=request=number="";if(now<invitationExpires)invitation=token();}if(now>=invitationExpires)invitation="";}
  synchronized boolean claim(String ticket,long now){expire(now);if(invitation.isEmpty()||!equal(invitation,ticket)){failures++;return false;}invitation="";pending=token();request=token();number=String.format(Locale.ROOT,"%06d",random.nextInt(1000000));pendingExpires=Math.min(now+2*60000L,invitationExpires);return true;}
  synchronized boolean decide(String id,boolean allow,long now){expire(now);if(request.isEmpty()||!equal(request,id))return false;if(allow){session=pending;invitation="";}else if(now<invitationExpires)invitation=token();pending=request=number="";return true;}
  synchronized boolean authorized(String cookie,long now){expire(now);return !session.isEmpty()&&equal(session,cookie);}
  synchronized String state(String cookie,long now){expire(now);if(authorized(cookie,now))return "paired";return !pending.isEmpty()&&equal(pending,cookie)?"pending":"unavailable";}
  synchronized String invitation(long now){expire(now);return invitation;}
  synchronized String pendingCookie(){return pending;}
  synchronized String request(long now){expire(now);return request;}
  synchronized String number(long now){expire(now);return number;}
  synchronized long pendingExpires(){return pendingExpires;}
  synchronized boolean paired(long now){expire(now);return !session.isEmpty();}
  synchronized boolean exhausted(){return failures>=10;}
}
