#!/usr/bin/env python3
"""
Script para renovar automáticamente el token JWT del SMN y subirlo al KV de Cloudflare Worker
Corre en loop cada 50 minutos para mantener el token siempre fresco
"""

import cloudscraper
import requests
import time
import re
from datetime import datetime

# ============================================================
# CONFIGURACIÓN - MODIFICAR ESTOS VALORES
# ============================================================

# URL de tu Cloudflare Worker
WORKER_URL = "https://mm-herramientas-worker.workers.dev"

# API Key secreta para proteger el endpoint (debe coincidir con worker.js)
# Generá una clave segura y usá la misma en ambos lados
WORKER_API_KEY = "CAMBIAR_ESTA_CLAVE_SECRETA"

# Intervalo de actualización en segundos (50 minutos = 3000 segundos)
# El token dura 1 hora, renovamos 10 min antes por seguridad
TOKEN_UPDATE_INTERVAL = 3000

# ============================================================
# FUNCIONES
# ============================================================

def get_smn_token():
    """Obtiene token JWT del SMN usando cloudscraper"""
    print(f"[{datetime.now()}] 📡 Obteniendo token del SMN...")
    
    scraper = cloudscraper.create_scraper()
    
    try:
        # Obtener cf_clearance y token
        response = scraper.get("https://www.smn.gob.ar/")
        response.raise_for_status()
        
        # Extraer token del HTML
        token_match = re.search(r"localStorage\.setItem\('token',\s*'([^']+)'\)", response.text)
        
        if not token_match:
            print(f"[{datetime.now()}] ❌ Token no encontrado en HTML")
            return None
        
        token = token_match.group(1)
        print(f"[{datetime.now()}] ✅ Token obtenido: {token[:30]}...")
        return token
        
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Error obteniendo token: {e}")
        return None

def upload_token_to_worker(token):
    """Sube el token al KV del Worker"""
    print(f"[{datetime.now()}] 📤 Subiendo token al Worker...")
    
    try:
        response = requests.post(
            f"{WORKER_URL}/smn/update-token",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {WORKER_API_KEY}"
            },
            json={"token": token},
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        print(f"[{datetime.now()}] ✅ Token subido exitosamente: {result}")
        return True
    except requests.exceptions.HTTPError as e:
        print(f"[{datetime.now()}] ❌ Error HTTP subiendo token: {e.response.status_code} - {e.response.text}")
        return False
    except Exception as e:
        print(f"[{datetime.now()}] ❌ Error subiendo token al Worker: {e}")
        return False

def main():
    print("=" * 60)
    print("🚀 Actualizador de Token SMN para Cloudflare Worker")
    print("=" * 60)
    print(f"⏰ Inicio: {datetime.now()}")
    print(f"🔄 Intervalo: {TOKEN_UPDATE_INTERVAL // 60} minutos")
    print(f"🌐 Worker: {WORKER_URL}")
    print("=" * 60)
    print()
    
    # Verificar configuración
    if WORKER_API_KEY == "CAMBIAR_ESTA_CLAVE_SECRETA":
        print("❌ ERROR: Debes configurar WORKER_API_KEY en el script")
        print("   Generá una clave segura y usá la misma en worker.js")
        return
    
    while True:
        try:
            # Obtener token
            token = get_smn_token()
            
            if token:
                # Subir al Worker
                if upload_token_to_worker(token):
                    print(f"[{datetime.now()}] ✅ Ciclo completado exitosamente")
                else:
                    print(f"[{datetime.now()}] ⚠️ No se pudo subir el token, reintentando en 1 min...")
                    time.sleep(60)
                    continue
            else:
                print(f"[{datetime.now()}] ⚠️ No se pudo obtener token, reintentando en 1 min...")
                time.sleep(60)
                continue
            
            # Esperar hasta la próxima actualización
            print(f"[{datetime.now()}] ⏰ Próxima actualización en {TOKEN_UPDATE_INTERVAL // 60} minutos...")
            print()
            time.sleep(TOKEN_UPDATE_INTERVAL)
            
        except KeyboardInterrupt:
            print(f"\n[{datetime.now()}] 👋 Detenido por usuario")
            break
        except Exception as e:
            print(f"[{datetime.now()}] ❌ Error inesperado: {e}")
            import traceback
            traceback.print_exc()
            print(f"[{datetime.now()}] ⏰ Reintentando en 1 minuto...")
            time.sleep(60)

if __name__ == "__main__":
    main()
