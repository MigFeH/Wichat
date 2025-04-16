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
}