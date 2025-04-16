import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class WeChatSimulation extends Simulation {

  // --- CONFIGURACIÓN ---
  // Credenciales válidas
  val loginUsername = "Test"
  val loginPassword = "123"

  // Define la URL base para el servicio de autenticación (login)
  val authBaseUrl = "http://localhost:8002"
  // Define la URL base para el servicio de usuarios/estadísticas
  val userStatsBaseUrl = "http://localhost:8001"

  // Configuración HTTP - No necesita baseUrl si usamos URLs completas o diferentes bases
  val httpProtocol = http
    // .baseUrl(authBaseUrl) // Podemos definir una o ninguna, o usar URLs completas
    .acceptHeader("application/json, text/plain, */*")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("en-US,en;q=0.5")
    .userAgentHeader("Gatling/3.7.0") // Identificador del cliente simulado
    .contentTypeHeader("application/json") // Default para POSTs con JSON

  // --- ESCENARIO ---
  // Simula el flujo de un usuario interactuando con las APIs
  val scn = scenario("WeChat API User Flow (Login + Stats)")

    // 1. Login API (en Servicio de Autenticación - Puerto 8002)
    .exec(http("API Login Request")
      .post(authBaseUrl + "/login") // URL Completa = authBaseUrl + endpoint
      .body(StringBody(s"""{"username": "$loginUsername", "password": "$loginPassword"}""")).asJson
      .check(status.is(200).saveAs("loginHttpStatus")) // Guardar status por si falla
      .check(jsonPath("$.token").exists.saveAs("authToken")) // Extraer el token JWT
      .check(jsonPath("$.username").is(loginUsername)) // Verificar que devuelve el username correcto
    )

    // Guardamos el username en la sesión de Gatling para usarlo después
    .exec(session => {
      // println(s"Login successful for ${session("loggedInUsername").as[String]}, Token: ${session("authToken").as[String]}") // Descomentar para depurar
      session.set("loggedInUsername", loginUsername)
    })

    .pause(2 seconds, 4 seconds) // Pausa aleatoria entre 2 y 4 segundos después del login

    // 2. API para obtener Estadísticas (en Servicio de Usuario/Stats - Puerto 8001)
    .exec(http("API Get Statistics Request")
      .get(userStatsBaseUrl + "/api/stats") // URL Completa = userStatsBaseUrl + endpoint
      .queryParam("username", "${loggedInUsername}") // Parámetro de consulta con el username de la sesión
      .header("Authorization", "Bearer ${authToken}") // Cabecera de autenticación con el token
      .check(status.is(200))
      .check(jsonPath("$").exists) // Verifica que devuelve algún JSON (asumiendo que devuelve un array o objeto)
      // .check(jsonPath("$[0].username").is(loginUsername)) // Si devuelve un array, verificar el username en el primer elemento
    )

    .pause(3 seconds) // Pausa final

  // --- CONFIGURACIÓN DE LA SIMULACIÓN ---
  setUp(
    scn.inject(
      // Perfil de Carga: empezar con 1 usuario, luego subir gradualmente a 15 usuarios durante 30 segundos
      atOnceUsers(1), // Empezar con 1 usuario inmediatamente
      rampUsers(14).during(30 seconds) // Añadir 14 usuarios más durante 30 segundos
    ).protocols(httpProtocol)
  ).assertions(
    // Criterios de Éxito Globales:
    global.responseTime.max.lt(5000),      // Máximo tiempo de respuesta < 5 segundos
    global.successfulRequests.percent.gt(97) // Más del 97% de las peticiones exitosas
  )
}