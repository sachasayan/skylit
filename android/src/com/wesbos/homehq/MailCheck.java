package com.wesbos.homehq;

import java.io.FilterInputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.InterruptedIOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.HashSet;
import javax.net.ssl.SSLSocketFactory;

/** One bounded import. Cancellation closes its sockets without waiting for IMAP logout. */
final class MailCheck {
  volatile int visited,imported,skipped;
  private final long deadline;
  private final HashSet<Socket> sockets=new HashSet<>();
  private volatile boolean stopped,timedOut;
  private volatile Thread thread;
  MailCheck(long milliseconds){deadline=System.nanoTime()+milliseconds*1000000L;}
  boolean active(){return !stopped&&System.nanoTime()<deadline;}
  boolean timedOut(){return timedOut;}
  void ensure() throws InterruptedIOException {if(!active())throw new InterruptedIOException("Mail check cancelled");}
  void attach(){thread=Thread.currentThread();if(!active())thread.interrupt();}
  private synchronized Socket track(Socket socket) throws IOException {if(!active()){socket.close();throw new InterruptedIOException("Mail check cancelled");}sockets.add(socket);return socket;}
  void stop(boolean timeout,boolean interrupt){
    Socket[] closing;Thread running;
    synchronized(this){if(stopped)return;timedOut=timeout;stopped=true;closing=sockets.toArray(new Socket[0]);sockets.clear();running=thread;}
    for(Socket socket:closing)try{socket.close();}catch(IOException ignored){}
    if(interrupt&&running!=null)running.interrupt();
  }
  InputStream guard(InputStream input){return new FilterInputStream(input){
    @Override public int read() throws IOException {ensure();int value=super.read();ensure();return value;}
    @Override public int read(byte[] bytes,int offset,int length)throws IOException{ensure();int count=in.read(bytes,offset,length);ensure();return count;}
  };}
  SSLSocketFactory socketFactory(){final SSLSocketFactory delegate=(SSLSocketFactory)SSLSocketFactory.getDefault();return new SSLSocketFactory(){
    public String[] getDefaultCipherSuites(){return delegate.getDefaultCipherSuites();}
    public String[] getSupportedCipherSuites(){return delegate.getSupportedCipherSuites();}
    @Override public Socket createSocket()throws IOException{ensure();return track(delegate.createSocket());}
    public Socket createSocket(Socket socket,String host,int port,boolean close)throws IOException{track(socket);ensure();return track(delegate.createSocket(socket,host,port,close));}
    private Socket connected(String host,int port,InetAddress local,int localPort)throws IOException{Socket socket=createSocket();if(local!=null)socket.bind(new InetSocketAddress(local,localPort));socket.connect(new InetSocketAddress(host,port),15000);ensure();return socket;}
    public Socket createSocket(String host,int port)throws IOException{return connected(host,port,null,0);}
    public Socket createSocket(String host,int port,InetAddress local,int localPort)throws IOException{return connected(host,port,local,localPort);}
    public Socket createSocket(InetAddress host,int port)throws IOException{return connected(host.getHostAddress(),port,null,0);}
    public Socket createSocket(InetAddress host,int port,InetAddress local,int localPort)throws IOException{return connected(host.getHostAddress(),port,local,localPort);}
  };}
}
