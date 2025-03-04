module.exports = {
  apps: [
    {
      name: "nups-prod",               
      script: "app.js",                
      env: {                          
        NODE_ENV: "production",       
        DOMAIN: "nupsweb.org",        
        PORT: 4000                    
      },
      env_development: {              
        NODE_ENV: "development",     
        DOMAIN: "dev.nupsweb.org",   
        PORT: 3000                    
      }
    },
    {
      name: "nups-dev",                
      script: "app.js",                
      env: {
        NODE_ENV: "development",      
        DOMAIN: "dev.nupsweb.org",    
        PORT: 3000                     
      }
    }
  ]
};

