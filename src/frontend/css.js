export const button = {
  fontSize: 18 + 'px',
  height: 50 + 'px',
  width: 100 + 'px',
  borderRadius: 6 + 'px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: 4 + 'px'
}

export const wide_button = {
  padding: 4 + 'px',
  fontSize: 18 + 'px',
  height: 42 + 'px',
  width: 'max-content',
  borderRadius: 6 + 'px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '4px'
}

export const full_size = {
  height: 100 + '%',
  width: 100 + '%',
}

export const full_width = {
  width: 100 + '%'
}

export const half_size = {
  height: 50 + '%',
  width: 50 + '%',
}

export const flex_center = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

export const space_around = {
  justifyContent: 'space-around'
}

export const flex_column = {
  flexDirection: 'column'
}

export const white_text = {
  color: 'whitesmoke'
}

export const btnOriginalColor = 'rgb(65,171,57)'
export const shadedBtnColor = 'rgb(95,211,77)'

export const createButtonStyle = {...flex_center, ...button, ...white_text }
export const editButtonStyle = {...flex_center, ...button, ...white_text }

export const bigColumnContainer = {...full_size, ...flex_center, ...flex_column, ...space_around }
export const lightCircleContainer = {...full_width, ...flex_center, ...space_around }

export const circle = {
  borderRadius: 50 + '%',
  height: 100 + 'px',
  width: 100 + 'px'
}

export const menu_button_position = {
  position: 'absolute',
  top: 30 + 'px',
  left: 30 + 'px',
  zIndex: 999,
  color: 'whitesmoke'
}

export const grid_container = {
  'display': 'grid',
  'gridTemplateColumns': 'auto auto auto auto',
  'backgroundColor': '#2196F3',
  'padding': 10 + 'px'
}