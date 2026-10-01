import { Product } from '@/lib/catalog';
export default function Tee({ product, className = '' }: { product: Product; className?: string }) {
  const fill =
    product.color === 'Butter' ? '#f6edcc' : product.color === 'Blush' ? '#eed1ce' : '#f8f5ee';
  return (
    <svg
      className={className}
      viewBox="0 0 440 460"
      role="img"
      aria-label={`${product.name} tee mockup in ${product.color}`}
    >
      <defs>
        <filter id={`shadow-${product.slug}`}>
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodOpacity=".13" />
        </filter>
        <linearGradient id={`fabric-${product.slug}`} x1="0" x2="1">
          <stop stopColor={fill} />
          <stop offset=".5" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor={fill} />
        </linearGradient>
      </defs>
      <g filter={`url(#shadow-${product.slug})`}>
        <path
          d="M155 65 L108 80 34 151 88 208 122 182 112 392 Q220 411 328 392 L318 182 352 208 406 151 332 80 285 65 Q220 93 155 65Z"
          fill={`url(#fabric-${product.slug})`}
          stroke="#cec6bc"
          strokeWidth="1.3"
        />
        <path
          d="M155 65 Q220 157 285 65 M166 70 Q220 139 274 70"
          fill="none"
          stroke="#c9c0b4"
          strokeWidth="2"
        />
        <path
          d="M125 180 L135 126 M316 180 L305 126 M118 380 Q220 394 322 380"
          fill="none"
          stroke="#d3cbbf"
          opacity=".6"
        />
      </g>
      <g fill={product.ink} textAnchor="middle">
        {product.design === 'cherry' ? (
          <>
            <path
              d="M216 216 Q244 169 268 168 M245 224 Q245 186 268 168"
              stroke={product.ink}
              strokeWidth="3"
              fill="none"
            />
            <ellipse cx="214" cy="231" rx="19" ry="21" />
            <ellipse cx="247" cy="240" rx="19" ry="21" />
            <path d="M259 173 Q234 148 229 173 Q246 184 259 173" />
            <text x="220" y="287" fontFamily="Georgia" fontStyle="italic" fontSize="23">
              sweet on you
            </text>
          </>
        ) : product.design === 'wish' ? (
          <>
            <text x="220" y="192" fontFamily="Georgia" fontSize="25">
              wish you
            </text>
            <text x="220" y="221" fontFamily="Georgia" fontSize="25">
              were here.
            </text>
            <path
              d="M165 258 Q190 241 220 258 T275 258 M165 268 Q190 251 220 268 T275 268"
              stroke={product.ink}
              fill="none"
            />
            <circle cx="250" cy="239" r="9" />
            <text x="220" y="291" fontFamily="Arial" fontSize="9" letterSpacing="1">
              SOMEWHERE, DOING NOTHING
            </text>
          </>
        ) : product.design === 'romanticize' ? (
          <>
            <text x="220" y="229" fontFamily="Georgia" fontStyle="italic" fontSize="29">
              romanticize
            </text>
            <text x="220" y="258" fontFamily="Georgia" fontStyle="italic" fontSize="29">
              it.
            </text>
            <text x="220" y="283" fontSize="10" letterSpacing="2">
              THE LITTLE THINGS
            </text>
          </>
        ) : (
          <>
            <text
              x="220"
              y="229"
              fontFamily="Georgia"
              fontWeight="bold"
              fontStyle="italic"
              fontSize="43"
            >
              off duty
            </text>
            <text x="220" y="258" fontFamily="Arial" fontSize="15" letterSpacing="6">
              SOCIAL CLUB
            </text>
            <text x="220" y="280" fontFamily="Georgia" fontSize="10">
              doing less, living more.
            </text>
          </>
        )}
      </g>
    </svg>
  );
}
