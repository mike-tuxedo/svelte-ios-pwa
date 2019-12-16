export const formatToInputDateTime = dateTime => {
    if (!dateTime) return '';

    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = date.getMonth()+1  < 10 ? `0${date.getMonth()+1}` : date.getMonth()+1;
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
    const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const formatDate = new Intl.DateTimeFormat('en', {
    weekday: 'short', month: 'long', day: 'numeric'
});

export const formatToReadable = dateTime => {
    if (!dateTime) return '';

    const date = new Date(dateTime);
    return formatDate.format(date);
}
