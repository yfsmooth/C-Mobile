/**
 * 格式化内容
 */
template.helper("subStr",function(value, count, suffix){
    if ( typeof value == 'string' ) {
        if ( !count ) count = 50;
        if ( value && value.length > count ) {
            value = value.substring(0, count);
            if ( suffix ) value += suffix;
        }
    }
    return value;
});
