// Configurations to export to the application

//Container for all environments

var environments = {};

// Development (default) environments
environments.development = {
    'port' : 9000,
    'envName' : 'development'
};

// Production environment
environments.production = {
    'port' : 2000,
    'envName' : 'production'
};

// Checking for the environment that was passed as a command line argument
var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not, default to development
var environmentToExport = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.development;

// Exporting the module
module.exports = environmentToExport;
