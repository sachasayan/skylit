package com.wesbos.homehq;
import android.content.*;
public class UpdateReceiver extends BroadcastReceiver {
  @Override public void onReceive(Context context,Intent intent){final PendingResult pending=goAsync();AppUpdates.get(context).result(intent,pending::finish);}
}
