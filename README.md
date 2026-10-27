# Spectraloptica-Frontend
Vue Frontend of Stackoptica


## Requirements

Node and npm requirements :
```
node v18.17.1
npm 10.8.2
```

Install all the npm dependencies needed :
```
npm install
```

### Start development

On two different terminals :

- Start the server handling the data :   
```flask run```
- Start the frontend server :   
```npm run dev```


### Start Production

Build the production files that will convert the VueApp to javascript files in */dist* folder:
```
npm run build
```

Start any server the webApp the *dist* folder e.g.: 
```
flask run
```

TODO :
verification blur pour opérations
Analyse composantes principales ->
Ajout les 4 (landmarks - distance - bounding_box - polygone)