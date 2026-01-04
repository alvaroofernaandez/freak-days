import type { H3Event } from "h3";
import { getHeader } from "h3";

export const serverSupabaseUser = async (event: H3Event) => {
  try {
    // Try to use Nuxt Supabase helper first (if available)
    // @ts-ignore - Nuxt Supabase module provides this
    if (typeof serverSupabaseClient !== 'undefined') {
      // @ts-ignore
      const supabase = serverSupabaseClient(event);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return user;
      }
    }
  } catch {
    // Fall through to manual implementation
  }

  // Manual implementation using cookies
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabaseUrl as string;
  const supabaseKey = config.public.supabaseAnonKey as string;

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: "Supabase config missing" });
  }

  // Import createClient dynamically to avoid issues
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try to get token from Authorization header first
  let token = getHeader(event, "Authorization")?.replace("Bearer ", "");

  // If no token in header, try to extract from Supabase cookies
  if (!token) {
    const cookieHeader = getHeader(event, "cookie") || "";
    
    // Nuxt Supabase module stores session in cookies
    // The cookie name format is: sb-{project-ref}-auth-token
    // Extract project ref from URL (e.g., https://xyz.supabase.co -> xyz)
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    const projectRef = urlMatch ? urlMatch[1] : null;
    
    // Try different cookie name patterns
    const cookiePatterns = projectRef 
      ? [`sb-${projectRef}-auth-token`, `sb-${projectRef}-auth-token-code-verifier`]
      : ["sb-auth-token", "supabase-auth-token"];

    for (const pattern of cookiePatterns) {
      // Match cookie value (handle URL encoding)
      const regex = new RegExp(`${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`);
      const cookieMatch = cookieHeader.match(regex);
      
      if (cookieMatch) {
        try {
          const cookieValue = decodeURIComponent(cookieMatch[1].replace(/"/g, ''));
          const cookieData = JSON.parse(cookieValue);
          
          // Try different token field names
          token = cookieData?.access_token || 
                  cookieData?.token || 
                  cookieData?.accessToken ||
                  cookieData?.session?.access_token;
          
          if (token) break;
        } catch (parseError) {
          // If JSON parsing fails, try the raw value as token
          const rawValue = cookieMatch[1].replace(/"/g, '');
          if (rawValue && rawValue.length > 50) {
            token = rawValue;
            break;
          }
        }
      }
    }

    // If still no token, try to get session using the cookie header
    if (!token && cookieHeader) {
      try {
        // Create a client that can read cookies
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }

  // If we have a token, verify it
  if (token) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      return user;
    }
  }

  return null;
};
