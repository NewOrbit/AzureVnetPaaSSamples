using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Data.SqlClient;
using System.Net.Http;

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

        public IActionResult SQL()
        {
            
            var connectionString = this.GetSQLConnectionString();
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

        public IActionResult SQLIP()
        {
            string serverName = "[not found yet]";
            try
            {
                var connectionString = this.GetSQLConnectionString();
                var builder = new SqlConnectionStringBuilder(connectionString);
                serverName = builder.DataSource;
                var hostEntry = System.Net.Dns.GetHostEntry(serverName);
                return this.Ok($"{serverName} : {hostEntry.HostName} : {String.Join(",", hostEntry.AddressList.Select(a => a.ToString()) )}");
            }
            catch (Exception e)
            {
                return this.StatusCode(500, $"ServerName: {serverName} Error: {e.Message}");
            }
        }

        public IActionResult IPLookup()
        {
            try
            {
                var hostName = this.configuration["hostname"];
                var hostEntry = System.Net.Dns.GetHostEntry(hostName);
                return this.Ok($"{hostName} : {hostEntry.HostName} : {String.Join(",", hostEntry.AddressList.Select(a => a.ToString()) )}");
            }
            catch (Exception e)
            {
                return this.StatusCode(500, e.Message);
            }

        }

        public async Task<IActionResult> WebResult()
        {
            try
            {
                var webaddress = this.configuration["webaddress"];
                var httpClient = new HttpClient();
                var result = await httpClient.GetAsync(webaddress);
                return this.Ok($"Url: {webaddress}. Response code: {result.StatusCode}");
            }
            catch (Exception e)
            {
                return this.StatusCode(500, e.Message);
            }
        }

        private string GetSQLConnectionString()
        {
            return this.configuration["sql"];
        }

    }
}
