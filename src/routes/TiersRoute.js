import React from 'react';

import RestResourceManager from '../components/RestResourceManager';

const fields = [
  {
    name: 'name',
    displayName: 'Name',
    fieldType: 'string',
    listingField: true,
    required: true,
  },
];

const TiersRoute = props => (
  <RestResourceManager
    {...props}
    endpoint="rsdir/tiers"
    fields={fields}
    resourceName="Tiers"
    singularResourceName="Tier"
  />
);

export default TiersRoute;
