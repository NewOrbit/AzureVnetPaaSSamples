using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Data.SqlClient;

namespace ConnectivityTester.Controllers
{
    public class TestController : Controller
    {
        private readonly ILogger<TestController> logger;
        private readonly IConfiguration configuration;

        public TestController(IConfiguration configuration, ILogger<TestController> logger)
        {
            this.configuration = configuration;
            this.logger = logger;
        }

        public IActionResult SQl()
        {
            
            var connectionString = this.configuration["sql"];
            logger.LogInformation("SQL con : {0}", connectionString);

            try
                {
                using (var connection = new SqlConnection(connectionString)) 
                { 
                    connection.Open();
                    using (var cmd = new SqlCommand("select @@SERVERNAME", connection))
                    {
                        var result = cmd.ExecuteScalar();
                        return Ok(result);
                    }
                }
            }
            catch (Exception e)
            {
                return this.StatusCode(500, e.Message);
            }
        }


    }
}
