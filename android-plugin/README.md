# Plugin nativo VpnStatus (Android)

Detecta se uma VPN está ativa **offline**, sem fazer requisição de rede,
consultando o `ConnectivityManager` do Android (`TRANSPORT_VPN`).

## Como instalar no projeto Android nativo

> Pré-requisito: você já rodou `npx cap add android` localmente — esse
> diretório `android/` não vive neste repositório.

### 1. Copiar o arquivo Kotlin

Crie a pasta de plugins (se não existir) e copie o arquivo:

```bash
mkdir -p android/app/src/main/java/br/com/qapqrv/app/plugins
cp android-plugin/VpnStatusPlugin.kt \
   android/app/src/main/java/br/com/qapqrv/app/plugins/
```

### 2. Registrar o plugin na MainActivity

Edite `android/app/src/main/java/br/com/qapqrv/app/MainActivity.java`
(ou `.kt`) e registre o plugin antes do `super.onCreate`:

**Java:**
```java
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import br.com.qapqrv.app.plugins.VpnStatusPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(VpnStatusPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
```

**Kotlin:**
```kotlin
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import br.com.qapqrv.app.plugins.VpnStatusPlugin

class MainActivity : BridgeActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    registerPlugin(VpnStatusPlugin::class.java)
    super.onCreate(savedInstanceState)
  }
}
```

### 3. Sincronizar e rebuildar

```bash
npm run build
npx cap sync android
npx cap open android   # ou: cd android && ./gradlew assembleDebug
```

### 4. Usar no app web

Já está integrado em `src/lib/vpn-status.ts`:

```ts
import { isVpnActive } from "@/lib/vpn-status";

const status = await isVpnActive();
// true  → VPN conectada
// false → sem VPN
// null  → desconhecido (web ou plugin não registrado)
```

## Permissões

Nenhuma permissão extra é necessária. `ConnectivityManager` com API 23+ usa
`ACCESS_NETWORK_STATE`, que já vem habilitada pelo Capacitor por padrão. Se
o build reclamar, adicione em `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```
