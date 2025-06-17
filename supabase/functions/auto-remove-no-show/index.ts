
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🕒 Verificando clientes com tempo de tolerância expirado...')
    
    const now = new Date()
    
    // Buscar parties com status 'ready' que passaram do tempo de tolerância + 30 segundos
    const { data: expiredParties, error: fetchError } = await supabaseClient
      .from('parties')
      .select('id, name, phone, notified_ready_at, tolerance_minutes, restaurant_id')
      .eq('status', 'ready')
      .not('notified_ready_at', 'is', null)
    
    if (fetchError) {
      console.error('Erro ao buscar parties:', fetchError)
      throw fetchError
    }

    if (!expiredParties || expiredParties.length === 0) {
      console.log('Nenhum cliente para verificar')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum cliente para verificar',
          processed: 0,
          timestamp: now.toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log(`Encontrados ${expiredParties.length} clientes para verificar`)
    let processedCount = 0

    for (const party of expiredParties) {
      const notifiedTime = new Date(party.notified_ready_at)
      
      // Buscar configuração de tolerância do restaurante
      const { data: restaurantData } = await supabaseClient
        .from('restaurants')
        .select('default_tolerance_minutes')
        .eq('id', party.restaurant_id)
        .single()
      
      const toleranceMinutes = restaurantData?.default_tolerance_minutes || party.tolerance_minutes || 2
      const toleranceMs = (toleranceMinutes * 60 * 1000) + (30 * 1000) // tolerance + 30 segundos
      const elapsed = now.getTime() - notifiedTime.getTime()

      console.log(`Cliente ${party.name}: ${Math.floor(elapsed/1000)}s decorridos, tolerância: ${toleranceMinutes}min + 30s = ${Math.floor(toleranceMs/1000)}s`)

      if (elapsed >= toleranceMs) {
        console.log(`⏰ Marcando ${party.name} como no-show (${Math.floor(elapsed/1000)}s decorridos, limite: ${Math.floor(toleranceMs/1000)}s)`)
        
        // Marcar como no-show usando a função existente
        const { error: noShowError } = await supabaseClient
          .rpc('mark_party_no_show', { party_uuid: party.id })

        if (noShowError) {
          console.error(`❌ Erro ao marcar ${party.name} como no-show:`, noShowError)
        } else {
          processedCount++
          console.log(`✅ ${party.name} marcado como no-show automaticamente`)
        }
      } else {
        const remainingMs = toleranceMs - elapsed
        console.log(`⏳ ${party.name} ainda tem ${Math.floor(remainingMs/1000)}s restantes`)
      }
    }
    
    console.log(`✅ Processamento concluído: ${processedCount} clientes removidos automaticamente`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processados ${processedCount} clientes expirados de ${expiredParties.length} verificados`,
        processed: processedCount,
        total_checked: expiredParties.length,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("❌ Erro na função auto-remove-no-show:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    )
  }
})
