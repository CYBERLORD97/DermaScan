import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record, old_record } = payload

    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: 'No record found' }), { status: 400 })
    }

    // Connect to Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch user email
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(record.user_id)
    if (userError || !userData.user) {
      console.error('Error fetching user', userError)
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    const email = userData.user.email
    const status = record.status

    console.log(`[EMAIL MOCK] Sending email to ${email}: Your appointment is now ${status}`)
    
    // In a real app, integrate Resend or SendGrid here
    // await fetch('https://api.resend.com/emails', { ... })

    return new Response(
      JSON.stringify({ success: true, message: `Email mocked to ${email}` }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
