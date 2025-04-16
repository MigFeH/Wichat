import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import scala.language.postfixOps

class WeChatSimulation extends Simulation {

  // --- CONFIGURACIÓN ---
  val loginUsername = "Test"
  val loginPassword = "123"
}