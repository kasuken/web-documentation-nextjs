import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

const mockData = {
  "data": {
    "viewer": {
      "login": "estruyf",
      "sponsors": {
        "edges": [
          {
            "node": {
              "name": "Elio Struyf",
              "url": "https://github.com/estruyf",
              "avatarUrl": "https://avatars.githubusercontent.com/u/2900833?v=4"
            }
          },
          {
            "node": {
              "name": "Elio Struyf",
              "url": "https://github.com/estruyf",
              "avatarUrl": "https://avatars.githubusercontent.com/u/2900833?v=4"
            }
          }
        ]
      }
    }
  }
}

const generateImage = async (data: typeof mockData) => {
  if (!data) {
    return null;
  }

  const sponsors = data.data.viewer.sponsors.edges.map(edge => edge.node);
  const images: string[] = [];

  let x = 0;
  let y = 0;
  let i = 0;

  for (const sponsor of sponsors) {
    const image = await fetch(sponsor.avatarUrl);

    // Fetch image and convert to base64
    const imageData = await image.buffer();
    images.push(`<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" x="${x}" y="${y}">
  <title>${sponsor.name}</title>
  <circle cx="32" cy="32" fill="url('#fill${i}')" r="32" stroke="#c0c0c0" stroke-width="1"/>
  <defs>
    <pattern height="64" id="fill${i}" patternUnits="userSpaceOnUse" width="64" x="0" y="0">
      <image href="data:${image.headers.get('content-type')};base64,${(imageData).toString('base64')}" height="64" width="64"/>
    </pattern>
  </defs>
</svg>`);
    
    x += 68;
    i++;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="64">${images.join(``)}</svg>`;
}

const api = async (req: NextApiRequest, res: NextApiResponse) => {

  res.setHeader('Content-Type', 'image/svg+xml');

  if (!process.env.GITHUB_AUTH) {
    const image = await generateImage(mockData);
    return res.status(200).send(image);
  }

  const response = await fetch(`https://api.github.com/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `token ${process.env.GITHUB_AUTH}`
    },
    body: JSON.stringify({
      query: `query SponsorQuery {
        viewer {
          login
          sponsors(first: 100) {
            edges {
              node {
                ... on User {
                  id
                  name
                  url
                  avatarUrl
                }
                ... on Organization {
                  id
                  name
                  url
                  avatarUrl
                }
              }
            }
          }
        }
      }`
    })
  });

  if (response && response.ok) {
    const data = await response.json();
    const image = await generateImage(data);
    return res.status(200).send(image);
  }

  res.status(200).json(null);
}

export default api;