import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import scala.language.postfixOps

class WeChatSimulation extends Simulation {

  // --- CONFIGURACIÓN ---
  val loginUsername = "Test"
  val loginPassword = "123"

  // URLs base para los microservicios backend
  val authBaseUrl = "http://localhost:8002"      // Puerto para /login
  val userStatsBaseUrl = "http://localhost:8001" // Puerto para /api/stats

  // Configuración del protocolo HTTP para Gatling
  val httpProtocol = http
    // No definimos un baseUrl global ya que llamamos a diferentes bases
    .acceptHeader("application/json, text/plain, */*") // Cabeceras estándar
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("en-US,en;q=0.5")
    .userAgentHeader("Gatling/3.10.5") // Puedes actualizar la versión si usas un Gatling más nuevo
    .contentTypeHeader("application/json") // Indica que enviaremos JSON por defecto
}