export const scoreIndicator = ({
  numPeople,
  numScores,
  size = 10,
  style = {},
}) => {
  const fill = numScores === 0 ? "white" : "rgba(0,0,0,0)";
  const [borderColor, borderWidth] =
    numPeople === 0
      ? ["rgba(0,0,0, 0.15)", "1px"]
      : numScores === 0
      ? ["currentColor", "2px"]
      : ["rgba(0,0,0,0)", "0px"];
  return $(`
        <svg height="${size + 4}" width="${size + 4}">
		  <polygon points="0,0 ${size},0 0,${size}" style="fill: ${fill}; stroke-width: 0" />
		  <line x1=0 y1=${size + 1} x2=${
    size + 1
  } y2=0 style="stroke:${borderColor}; stroke-width:${borderWidth}" />
		</svg>
    `).css(style);
};

// export const style = `
//     .badge.score-info-badge { padding: 2px 5px; }
//     .badge.score-info-badge.fulfilled { background-color: gray; opacity: 0.3; }
//     .badge.score-info-badge.error     { background-color: gray; opacity: 0.5; }
//     .badge.score-info-badge.unknown   { background-color: gray; opacity: 0.3; }
// `

// .glyphicon.glyphicon-bookmark {
// 	font-size: 0.8em;
// 	align-self: flex-start;
// 	margin-right: 0.3em;
// 	margin-left: 0.1em;
// 	opacity: 0.5;
// }
