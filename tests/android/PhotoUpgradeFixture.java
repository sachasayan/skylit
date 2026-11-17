package com.wesbos.homehq;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import java.io.ByteArrayOutputStream;
import org.json.JSONArray;

/** Synthetic data only, compiled into a separate, private test application. */
final class PhotoUpgradeFixture {
  static void seed(Context context,String mode){
    if(mode==null||!PhotoPolicy.limits(0,200))return; // Seed only the published legacy implementation.
    SharedPreferences marker=context.getSharedPreferences("upgrade-fixture",0);
    if(marker.getBoolean("seeded",false))return;
    try{
      PhotoStore store=new PhotoStore(context);int count="count".equals(mode)?120:6;
      JSONArray ids=new JSONArray();
      for(int i=0;i<count;i++){
        Bitmap image=Bitmap.createBitmap(400,300,Bitmap.Config.ARGB_8888);
        image.eraseColor(0xff000000|((i+1)*97777&0xffffff));
        ByteArrayOutputStream output=new ByteArrayOutputStream();image.compress(Bitmap.CompressFormat.PNG,100,output);image.recycle();
        String id=store.importImage(output.toByteArray());if(id.isEmpty())throw new AssertionError("Synthetic import failed");ids.put(id);
      }
      store.keeper(ids.getString(0),true);store.keeper(ids.getString(1),true);
      store.exclude(ids.getString(1),true);store.exclude(ids.getString(2),true);
      SharedPreferences index=context.getSharedPreferences("skylit-photo-index",0);
      JSONArray rows=new JSONArray(index.getString("items","[]"));long now=System.currentTimeMillis();
      for(int i=0;i<rows.length();i++)rows.getJSONObject(i).put("at",now-("count".equals(mode)||i<2?200L+i:i)*86400000L);
      index.edit().putString("items",rows.toString()).putBoolean("dates",true).commit();
      int days="count".equals(mode)?0:30;
      context.getSharedPreferences("skylit-photo-mail",0).edit().putInt("days",days).putInt("maximum",200).putInt("interval",3600).putBoolean("trusted",true).putString("senders","[\"synthetic@example.invalid\"]").commit();
      store.prune(days,200);
      marker.edit().putBoolean("seeded",true).commit();
    }catch(Exception exception){throw new AssertionError("Synthetic fixture setup failed",exception);}
  }
}
