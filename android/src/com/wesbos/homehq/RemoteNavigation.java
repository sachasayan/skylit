package com.wesbos.homehq;

/** Exact top-level HTTPS destinations; remote pages never receive the native bridge. */
final class RemoteNavigation {
  static boolean allows(String scheme, String host, boolean youtube) {
    if (!"https".equals(scheme) || host == null) return false;
    if (youtube) {
      return host.equals("www.youtube.com") || host.equals("m.youtube.com")
          || host.equals("youtube.com") || host.equals("accounts.youtube.com") || host.equals("accounts.google.com") || host.equals("gds.google.com")
          || host.equals("consent.youtube.com") || host.equals("consent.google.com");
    }
    return host.equals("photos.app.goo.gl") || host.equals("photos.google.com")
        || host.equals("accounts.google.com") || host.equals("gds.google.com") || host.equals("home.google.com")
        || host.equals("www.google.com") || host.equals("myaccount.google.com")
        || host.equals("keep.google.com") || host.equals("calendar.google.com")
        || host.equals("workspace.google.com") || host.equals("consent.google.com");
  }
}
