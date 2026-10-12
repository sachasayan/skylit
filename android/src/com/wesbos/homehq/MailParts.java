package com.wesbos.homehq;

import java.io.InputStream;
import javax.mail.Multipart;
import javax.mail.Part;
import javax.mail.MessagingException;
import javax.mail.FolderClosedException;
import javax.mail.StoreClosedException;
import javax.mail.internet.MimeMultipart;
import com.sun.mail.util.DecodingException;

/** Walks bounded MIME parts; a malformed picture never starves its valid siblings. */
final class MailParts {
  interface ImageSink {void accept(InputStream input,long received) throws Exception;}
  private MailParts(){}
  static boolean connectionFailure(MessagingException error){
    java.util.HashSet<Throwable> seen=new java.util.HashSet<>();Throwable cause=error;
    while(cause!=null&&seen.add(cause)){
      if(cause instanceof java.io.IOException&&!(cause instanceof DecodingException))return true;
      cause=cause instanceof MessagingException?((MessagingException)cause).getNextException():cause.getCause();
    }
    return false;
  }
  static int collect(Part part,long received,int remaining,ImageSink sink)throws Exception{return collect(part,received,remaining,sink,()->{});}
  static int collect(Part part,long received,int remaining,ImageSink sink,Runnable rejected)throws Exception{
    if(remaining<=0)return 0;
    return new Walk(remaining,sink,rejected).collect(part,received,0);
  }
  private static final class Walk {
    int remaining,parts=1000;
    final ImageSink sink;final Runnable rejected;
    Walk(int limit,ImageSink target,Runnable failure){remaining=limit;sink=target;rejected=failure;}
    int collect(Part part,long received,int depth)throws Exception{
      if(remaining<=0||parts--<=0)return 0;
      if(depth>16){rejected.run();return 0;}
      try{
        if(part.isMimeType("multipart/*")){
          Multipart multipart=new MimeMultipart(part.getDataHandler().getDataSource());
          int scanned=0,count=multipart.getCount();
          for(int i=0;i<count&&remaining>0&&parts>0;i++)scanned+=collect(multipart.getBodyPart(i),received,depth+1);
          return scanned;
        }
        if(!(part.isMimeType("image/jpeg")||part.isMimeType("image/png")||part.isMimeType("image/webp")||part.isMimeType("image/heic")))return 0;
        remaining--;
        if(part.getSize()>PhotoPolicy.MAX_DOWNLOAD){rejected.run();return 1;}
        try(InputStream input=part.getInputStream()){sink.accept(input,received);}
        catch(DecodingException|IllegalArgumentException malformed){rejected.run();}
        return 1;
      }catch(FolderClosedException|StoreClosedException network){throw network;}
      catch(MessagingException malformed){if(connectionFailure(malformed))throw malformed;rejected.run();return 0;}
    }
  }
}
