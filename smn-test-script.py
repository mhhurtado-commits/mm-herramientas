#!/usr/bin/env python3
"""
Script de prueba para verificar si podemos obtener token JWT y cf_clearance del SMN
Este script NO modifica nada, solo hace pruebas de lectura.
"""

import cloudscraper
import re
import json
from datetime import datetime

def test_smn_access():
    print("=" * 60)
    print("🧪 Script de prueba - Acceso a SMN")
    print("=" * 60)
    print(f"⏰ Hora de inicio: {datetime.now()}")
    print()
    
    # Crear scraper con cloudscraper
    print("📡 Creando scraper con cloudscraper...")
    scraper = cloudscraper.create_scraper()
    print("✅ Scraper creado")
    print()
    
    # Intentar acceder a www.smn.gob.ar
    print("🌐 Intentando acceder a https://www.smn.gob.ar/...")
    try:
        response = scraper.get("https://www.smn.gob.ar/")
        print(f"✅ Status code: {response.status_code}")
        print(f"📄 Content length: {len(response.text)} bytes")
        print()
        
        # Mostrar cookies obtenidas
        print("🍪 Cookies obtenidas:")
        if response.cookies:
            for cookie in response.cookies:
                print(f"   - {cookie.name}: {cookie.value[:50]}{'...' if len(cookie.value) > 50 else ''}")
        else:
            print("   ⚠️ No se obtuvieron cookies")
        print()
        
        # Buscar cf_clearance específicamente
        cf_clearance = response.cookies.get('cf_clearance')
        if cf_clearance:
            print(f"✅ cf_clearance encontrado: {cf_clearance[:50]}...")
        else:
            print("⚠️ cf_clearance NO encontrado")
        print()
        
        # Buscar token JWT en el HTML
        print("🔍 Buscando token JWT en el HTML...")
        token_match = re.search(r"localStorage\.setItem\('token',\s*'([^']+)'\)", response.text)
        
        if token_match:
            token = token_match.group(1)
            print(f"✅ Token JWT encontrado!")
            print(f"   Token completo: {token}")
            print(f"   Longitud: {len(token)} caracteres")
            print(f"   Prefijo: {token[:20]}...")
            print(f"   Sufijo: ...{token[-20:]}")
            
            # Verificar si es un JWT válido (debe tener 3 partes separadas por .)
            parts = token.split('.')
            if len(parts) == 3:
                print("✅ Token tiene formato JWT válido (3 partes)")
                try:
                    # Intentar decodificar el payload (parte del medio)
                    import base64
                    payload = parts[1]
                    # Añadir padding si es necesario
                    padding = 4 - len(payload) % 4
                    if padding != 4:
                        payload += '=' * padding
                    decoded = base64.b64decode(payload)
                    print(f"📋 Payload decodificado: {decoded.decode('utf-8')}")
                except Exception as e:
                    print(f"⚠️ No se pudo decodificar el payload: {e}")
            else:
                print(f"⚠️ Token NO tiene formato JWT estándar (tiene {len(parts)} partes)")
        else:
            print("❌ Token JWT NO encontrado en el HTML")
            print("🔎 Buscando patrones alternativos...")
            
            # Buscar otros patrones posibles
            alt_patterns = [
                r"token['\"]\s*:\s*['\"]([^'\"]+)['\"]",
                r"'token'\s*,\s*'([^']+)'",
                r'"token"\s*,\s*"([^"]+)"',
            ]
            
            for i, pattern in enumerate(alt_patterns, 1):
                alt_match = re.search(pattern, response.text)
                if alt_match:
                    print(f"   ✅ Patrón {i} encontrado: {alt_match.group(1)[:50]}...")
                else:
                    print(f"   ❌ Patrón {i} no encontrado")
        
        print()
        
        # Guardar HTML para inspección manual si es necesario
        print("💾 Guardando HTML en 'smn-response.html' para inspección...")
        with open('smn-response.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        print("✅ HTML guardado")
        print()
        
        # Si encontramos token, intentar llamar a la API del SMN
        if token_match:
            print("🧪 Intentando llamar a la API del SMN con el token...")
            test_smn_api(token)
        else:
            print("⏭️ Saltando prueba de API (no se encontró token)")
        
    except Exception as e:
        print(f"❌ Error accediendo a www.smn.gob.ar: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 60)
    print(f"⏰ Hora de finalización: {datetime.now()}")
    print("=" * 60)

def test_smn_api(token):
    """Intenta llamar a la API del SMN con el token obtenido"""
    print()
    print("-" * 60)
    print("🧪 Prueba de API SMN")
    print("-" * 60)
    
    # ID de ubicación de San Rafael
    location_id = "9553"
    
    endpoints = [
        f"weather/location/{location_id}",
        f"forecast/location/{location_id}",
        f"sun/location/{location_id}",
    ]
    
    scraper = cloudscraper.create_scraper()
    
    for endpoint in endpoints:
        print(f"\n📡 Probando endpoint: {endpoint}")
        try:
            response = scraper.get(
                f"https://ws1.smn.gob.ar/v1/{endpoint}",
                headers={
                    "Authorization": f"JWT {token}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                }
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ Éxito!")
                data = response.json()
                print(f"   📋 Respuesta (primeros 500 chars): {json.dumps(data, indent=2)[:500]}...")
                
                # Guardar respuesta completa
                filename = f"smn-api-{endpoint.replace('/', '-')}.json"
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                print(f"   💾 Guardado en {filename}")
            else:
                print(f"   ❌ Error: {response.text[:200]}")
                
        except Exception as e:
            print(f"   ❌ Excepción: {e}")

if __name__ == "__main__":
    print("⚠️  Este script requiere Python 3 y las dependencias:")
    print("   pip install cloudscraper")
    print()
    
    try:
        import cloudscraper
        test_smn_access()
    except ImportError:
        print("❌ Error: cloudscraper no está instalado")
        print("   Ejecuta: pip install cloudscraper")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
