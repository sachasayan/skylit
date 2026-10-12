package com.wesbos.homehq;
import android.content.*;
public class UpdateReceiver extends BroadcastReceiver {
  @Override public void onReceive(Context context,Intent intent){AppUpdates.get(context).result(intent);}
}
