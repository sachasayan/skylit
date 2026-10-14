package com.wesbos.homehq;

import org.json.JSONObject;
import java.util.Iterator;

/** Strictly bounded, non-secret display preferences for Android document transfer. */
final class DisplayTransfer {
  static String validate(String raw) throws Exception {
    if(raw==null||raw.length()>4096)throw new IllegalArgumentException();
    JSONObject row=new JSONObject(raw);
    if(!"skylit-display".equals(row.getString("format"))||row.getInt("version")!=1)throw new IllegalArgumentException();
    only(row,"format","version","display");
    JSONObject display=row.getJSONObject("display");
    only(display,"theme","mode","clock","units","text","preset","home","youtube");
    value(display,"theme","linen","sage","stone","ocean","plum","contrast");
    value(display,"mode","light","dark","auto");value(display,"clock","12","24");
    value(display,"units","celsius","fahrenheit");value(display,"text","standard","large");
    value(display,"preset","balanced","photos","agenda");
    for(String key:new String[]{"home","youtube"})if(display.has(key)&&!(display.get(key) instanceof Boolean))throw new IllegalArgumentException();
    return row.toString();
  }
  private static void value(JSONObject row,String key,String... values)throws Exception {
    if(!row.has(key))return;Object raw=row.get(key);if(!(raw instanceof String))throw new IllegalArgumentException();
    for(String value:values)if(value.equals(raw))return;throw new IllegalArgumentException();
  }
  private static void only(JSONObject row,String... allowed)throws Exception {
    for(Iterator<String> keys=row.keys();keys.hasNext();){String key=keys.next();boolean found=false;for(String candidate:allowed)if(key.equals(candidate))found=true;if(!found)throw new IllegalArgumentException();}
  }
}
