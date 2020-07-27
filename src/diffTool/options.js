// OPTION A
// #/web-api/end-points//organizations/{organizationId}/products
root = {
 parentId: null,
 shortId: "#/web-api/end-points//organizations/{organizationId}/products",
 children: {
    "get/request/parameter/reviews": leaf
 }
 ...
}


// OPTION B
// #/web-api/end-points//organizations/{organizationId}/products
root = {
    parentId: "#/web-api/end-points//organizations/{organizationId}/",
    shortId: "products",
    children: {
       "get/request/parameter/reviews": node,
       "get/request/parameter/name": node
    },
    ...
   }


   

// #/web-api/end-points//organizations/{organizationId}/products/get/request/parameter/reviews
leaf = {
 parentId: "#/web-api/end-points//organizations/{organizationId}/products",
 shortId: "get/request/parameter/reviews"
 ...
}





// #/web-api/end-points//organizations/{organizationId}/products/get/request/parameter/reviews
leaf1 = {
 parentId: "#/web-api/end-points//organizations/{organizationId}/products/get/request/parameter/",
 shortId: "reviews",
 ...
}


leaf2 = {
    parentId: "#/web-api/end-points//organizations/{organizationId}/products",
    shortId: "get/request/parameter/reviews"
    ...
}


'New node: "#/web-api/end-points//organizations/{organizationId}/products/get/ '